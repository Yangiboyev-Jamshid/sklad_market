import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SearchNormal1, Call, DocumentText1, ArrowLeft2, More, Send, Trash, Paperclip2 } from "iconsax-reactjs";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { getChats, getChatMessages, deleteChat, uploadChatImage } from "../../api/api";
import { subscribeThread, sendChatSocketMessage, sendTyping, sendRead, onChatEvent } from "../../api/chatSocket";
import { useAuth } from "../../context/AuthContext";
import { CHAT_ENABLED } from "../../config/chatConfig";

const PER_PAGE = 30;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const TYPING_THROTTLE_MS = 2500;
const TYPING_EXPIRE_MS = 4000;

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  const parts = (name ?? "").trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "?";
}

function MessageStatus({ status }) {
  if (status === "failed") return <span className="text-danger-500 text-[11px]">!</span>;
  if (status === "read") return <span className="text-brand-400 text-[11px]">✓✓</span>;
  if (status === "delivered") return <span className="text-ink-300 dark:text-ink-600 text-[11px]">✓✓</span>;
  if (status === "sending") return null;
  return <span className="text-ink-300 dark:text-ink-600 text-[11px]">✓</span>;
}

export default function ChatPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedThreadId = searchParams.get("thread");

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeId, setActiveId] = useState(requestedThreadId ? Number(requestedThreadId) : null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(!!requestedThreadId);
  const [deletingId, setDeletingId] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const attachInputRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const lastTypingSentRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const active = threads.find((th) => th.thread_id === activeId);

  const loadThreads = useCallback(async () => {
    // Chat backend integration is temporarily disabled (see config/chatConfig.js).
    if (!CHAT_ENABLED) {
      setThreadsLoading(false);
      return;
    }
    try {
      const data = await getChats({ per_page: 50 });
      const items = data?.items ?? [];
      setThreads(items);
      setActiveId((prev) => prev ?? items[0]?.thread_id ?? null);
    } catch {
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const loadMessages = useCallback(async (threadId) => {
    if (!CHAT_ENABLED || !threadId) return;
    setMessagesLoading(true);
    try {
      const data = await getChatMessages(threadId, { per_page: PER_PAGE });
      const items = (data?.items ?? []).slice().reverse(); // oldest first
      setChatMessages(items);
      const unreadIds = items.filter((m) => m.sender_id !== user?.id && m.status !== "read").map((m) => m.id);
      if (unreadIds.length) sendRead(threadId, unreadIds);
    } catch {
      setChatMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeId) {
      setChatMessages([]);
      setOtherTyping(false);
      subscribeThread(activeId);
      loadMessages(activeId);
    }
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Live transport — everything below arrives over the chat WebSocket
  // (see api/chatSocket.js), not REST.
  useEffect(() => {
    const offMessage = onChatEvent("new_message", ({ thread_id, message }) => {
      if (!message) return;
      const isMine = message.sender_id === user?.id;

      if (thread_id === activeIdRef.current) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          if (isMine) {
            const pendingIdx = prev.findIndex((m) => m._optimistic && m.status !== "failed");
            if (pendingIdx !== -1) {
              const copy = prev.slice();
              copy[pendingIdx] = message;
              return copy;
            }
          }
          return [...prev, message];
        });
        if (!isMine) sendRead(thread_id, [message.id]);
        setOtherTyping(false);
      }

      setThreads((prev) => {
        const idx = prev.findIndex((th) => th.thread_id === thread_id);
        if (idx === -1) {
          loadThreads();
          return prev;
        }
        const copy = prev.slice();
        const isActive = thread_id === activeIdRef.current;
        copy[idx] = {
          ...copy[idx],
          last_message: message,
          unread_count: isMine || isActive ? 0 : (copy[idx].unread_count ?? 0) + 1,
        };
        return copy;
      });
    });

    const offRead = onChatEvent("read_receipt", ({ thread_id, message_ids }) => {
      if (thread_id !== activeIdRef.current || !message_ids?.length) return;
      setChatMessages((prev) => prev.map((m) => (message_ids.includes(m.id) ? { ...m, status: "read" } : m)));
    });

    const offTyping = onChatEvent("typing", ({ thread_id, user_id }) => {
      if (thread_id !== activeIdRef.current || user_id === user?.id) return;
      setOtherTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), TYPING_EXPIRE_MS);
    });

    const offError = onChatEvent("error", (data) => {
      console.error("[chat] socket error", data);
    });

    return () => {
      offMessage();
      offRead();
      offTyping();
      offError();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user?.id, loadThreads]);

  const sendMessage = (body, attachmentKey, attachmentUrl) => {
    if (!activeId || !body?.trim()) return;
    const trimmed = body.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      body: trimmed,
      attachment_url: attachmentUrl,
      thread_id: activeId,
      sender_id: user?.id,
      sender_type: "user",
      sent_at: new Date().toISOString(),
      status: "sending",
      _optimistic: true,
    };
    setChatMessages((prev) => [...prev, optimistic]);
    const ok = sendChatSocketMessage(activeId, trimmed, attachmentKey);
    if (!ok) {
      setChatMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: "failed" } : m)));
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now;
      sendTyping(activeId);
    }
  };

  const handleDeleteChat = async (threadId) => {
    if (!window.confirm(t("chat.deleteChatConfirm"))) return;
    setDeletingId(threadId);
    try {
      await deleteChat(threadId);
      setThreads((prev) => prev.filter((th) => th.thread_id !== threadId));
      if (activeId === threadId) {
        setActiveId(null);
        setChatMessages([]);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert(t("chat.invalidImageType"));
      if (attachInputRef.current) attachInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      alert(t("chat.imageTooLarge"));
      if (attachInputRef.current) attachInputRef.current.value = "";
      return;
    }
    setAttaching(true);
    try {
      const result = await uploadChatImage(activeId, file);
      sendMessage(file.name, result?.attachment_key, result?.attachment_url);
    } catch (err) {
      alert(err.message);
    } finally {
      setAttaching(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  };

  const openChat = (id) => {
    setActiveId(id);
    setMobileShowChat(true);
    setThreads((prev) =>
      prev.map((th) => (th.thread_id === id ? { ...th, unread_count: 0 } : th))
    );
  };

  if (!CHAT_ENABLED) {
    return (
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] h-[560px] sm:h-[600px] flex flex-col items-center justify-center gap-2 text-center px-6 transition-colors">
        <p className="font-semibold text-lg text-ink-900 dark:text-white">{t("chat.temporarilyUnavailable")}</p>
        <p className="text-sm text-ink-400 dark:text-ink-500 max-w-sm">{t("chat.temporarilyUnavailableDesc")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] grid grid-cols-1 md:grid-cols-[280px_1fr] overflow-hidden h-[560px] sm:h-[600px] transition-colors">
      <div className={`border-r border-ink-100 dark:border-[#1C1C1C] flex min-h-0 flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-4">
          <div className="pb-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4">{t("chat.messages")}</p>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 bg-white dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-2xl px-3 py-2.5">
              <SearchNormal1 size={16} className="text-ink-400" />
              <input placeholder={t("chat.searchMessages")} className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {threadsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex mt-4 items-center gap-3 p-2 border rounded-xl border-ink-50 dark:border-[#1C1C1C]/60">
                <div className="w-10 h-10 rounded-full bg-ink-100 dark:bg-[#1C1C1C] animate-pulse shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-ink-100 dark:bg-[#1C1C1C] rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-ink-100 dark:bg-[#1C1C1C] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ink-400 dark:text-ink-500 text-sm">
              {t("chat.noActiveChats")}
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.thread_id}
                className={`group w-full flex mt-4 items-center gap-3 p-2 text-left border rounded-xl border-ink-50 dark:border-[#1C1C1C]/60 transition-colors ${activeId === thread.thread_id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-[#171717]"
                  } ${deletingId === thread.thread_id ? "opacity-50" : ""}`}
              >
                <button onClick={() => openChat(thread.thread_id)} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {thread.other_party?.avatar_url ? (
                      <img src={thread.other_party.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(thread.other_party?.display_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{thread.other_party?.display_name ?? "—"}</p>
                      <span className="text-[11px] text-ink-300 dark:text-ink-600 shrink-0">{formatTime(thread.last_message?.sent_at)}</span>
                    </div>
                    <p className="text-xs text-[#7F7F7F] truncate">
                      <span>{thread.last_message?.body || "—"}</span><br />
                    </p>
                    <div className="text-[10px] flex items-center justify-between text-[#7F7F7F] truncate">
                      <span>{thread.product?.name}</span>
                      {thread.unread_count > 0 && <div className="flex justify-center items-end">
                        <span className="text-[7px] w-[11px] h-[11px] flex items-center justify-center dark:text-black text-white rounded-full bg-brand-600">{thread.unread_count}</span>
                      </div>}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteChat(thread.thread_id)}
                  disabled={deletingId === thread.thread_id}
                  title={t("chat.deleteChat")}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger-500 dark:text-ink-600 dark:hover:text-danger-500 transition-opacity p-1"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`min-h-0 flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {active ? (
          <>
            <div className="flex shrink-0 items-center justify-between p-4 border-b border-ink-100 dark:border-[#1C1C1C]">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden text-ink-500 dark:text-ink-300 shrink-0">
                  <ArrowLeft2 size={20} />
                </button>
                <div className="w-10 h-10 rounded-xl bg-[#2E6FFC] text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {active.other_party?.avatar_url ? (
                    <img src={active.other_party.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(active.other_party?.display_name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{active.other_party?.display_name ?? "—"}</p>
                  {otherTyping ? (
                    <p className="text-xs text-brand-500 dark:text-brand-400">{t("chat.typing")}</p>
                  ) : (
                    <p className="text-xs flex items-center gap-1 text-success-600 dark:text-success-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> {t("chat.online")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-ink-400 dark:text-white shrink-0">
                <Call size={24} />
                <More size={24} style={{ transform: "rotate(90deg)" }} />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {messagesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="h-10 w-40 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                  </div>
                ))
              ) : chatMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-ink-400 dark:text-ink-500 text-sm">
                  {t("chat.startConversation")}
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isMine = m.sender_id === user?.id || m.sender_type === "user" || m._optimistic;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {m.attachment_url ? (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-brand-600 text-white rounded-2xl px-4 py-3 flex items-center gap-2 max-w-[85%] sm:max-w-xs"
                        >
                          <DocumentText1 size={18} className="shrink-0" />
                          <span className="text-sm truncate">{m.body || t("chat.file")}</span>
                        </a>
                      ) : (
                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-700 dark:text-ink-200"
                            }`}
                        >
                          {m.body}
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-ink-300 dark:text-ink-600 mt-1">
                        {formatTime(m.sent_at)}
                        {isMine && <MessageStatus status={m.status} />}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex shrink-0 items-center gap-4 px-4 sm:px-6 py-4 border-t border-ink-100 dark:border-[#1C1C1C]">
              <button className="text-[#75809F] text-[24px] hover:text-[#1A94FF] transition-colors shrink-0" type="button">
                <HiOutlineEmojiHappy />
              </button>
              <input
                ref={attachInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleAttach}
              />
              <button
                onClick={() => attachInputRef.current?.click()}
                disabled={attaching}
                className="text-[#75809F] hover:text-[#1A94FF] disabled:opacity-50 transition-colors shrink-0"
                type="button"
                title={t("chat.attachImage")}
              >
                <Paperclip2 size={22} />
              </button>
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t("chat.messagePlaceholder")}
                className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-[#75809F] text-ink-900 dark:text-white"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="text-[#1A94FF] hover:text-brand-700 disabled:opacity-40 transition-colors p-1 shrink-0" type="button">
                <Send size={24} variant="Bold" />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-ink-400 dark:text-ink-500 text-sm">
            {t("chat.selectChat")}
          </div>
        )}
      </div>
    </div>
  );
}

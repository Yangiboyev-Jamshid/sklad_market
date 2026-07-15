import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchNormal1, Call, DocumentText1, ArrowLeft2, More, Send, Trash, Paperclip2 } from "iconsax-reactjs";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import { getChats, getChatMessages, sendChatMessage, deleteChat, uploadChatImage, uploadChatFile } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const PER_PAGE = 30;

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

export default function ChatPanel() {
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

  const messagesEndRef = useRef(null);
  const attachInputRef = useRef(null);
  const sendingRef = useRef(false);

  const active = threads.find((t) => t.thread_id === activeId);

  const loadThreads = useCallback(async () => {
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
    if (!threadId) return;
    setMessagesLoading(true);
    try {
      const data = await getChatMessages(threadId, { per_page: PER_PAGE });
      const items = (data?.items ?? []).slice().reverse(); // oldest first
      setChatMessages(items);
    } catch {
      setChatMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      setChatMessages([]);
      loadMessages(activeId);
    }
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async (body) => {
    if (!activeId || !body?.trim() || sendingRef.current) return;
    sendingRef.current = true;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      body: body.trim(),
      thread_id: activeId,
      sender_id: user?.id,
      sender_type: "user",
      sent_at: new Date().toISOString(),
      _optimistic: true,
    };

    setChatMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const sent = await sendChatMessage(activeId, body.trim());
      setChatMessages((prev) => prev.map((m) => (m.id === optimisticId ? (sent ?? { ...optimistic, _optimistic: false }) : m)));
    } catch (err) {
      // Real send failed — drop the fake bubble so it doesn't look delivered, and tell the user.
      setChatMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert(err.message);
    } finally {
      sendingRef.current = false;
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
  };

  const handleDeleteChat = async (threadId) => {
    if (!window.confirm("Удалить чат из списка?")) return;
    setDeletingId(threadId);
    try {
      await deleteChat(threadId);
      setThreads((prev) => prev.filter((t) => t.thread_id !== threadId));
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
    setAttaching(true);
    try {
      const isImage = file.type.startsWith("image/");
      const result = isImage
        ? await uploadChatImage(activeId, file)
        : await uploadChatFile(activeId, file);
      const optimistic = {
        id: `opt-${Date.now()}`,
        body: file.name,
        attachment_url: result?.attachment_url,
        thread_id: activeId,
        sender_id: user?.id,
        sender_type: "user",
        sent_at: new Date().toISOString(),
        _optimistic: true,
      };
      setChatMessages((prev) => [...prev, optimistic]);
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
      prev.map((t) => (t.thread_id === id ? { ...t, unread_count: 0 } : t))
    );
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] grid grid-cols-1 md:grid-cols-[280px_1fr] overflow-hidden h-[560px] sm:h-[600px] transition-colors">
      <div className={`border-r border-ink-100 dark:border-[#1C1C1C] flex min-h-0 flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-4">
          <div className="pb-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4">Сообщения</p>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 bg-white dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-2xl px-3 py-2.5">
              <SearchNormal1 size={16} className="text-ink-400" />
              <input placeholder="Поиск сообщений" className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white" />
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
              Нет активных чатов
            </div>
          ) : (
            threads.map((t) => (
              <div
                key={t.thread_id}
                className={`group w-full flex mt-4 items-center gap-3 p-2 text-left border rounded-xl border-ink-50 dark:border-[#1C1C1C]/60 transition-colors ${activeId === t.thread_id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-[#171717]"
                  } ${deletingId === t.thread_id ? "opacity-50" : ""}`}
              >
                <button onClick={() => openChat(t.thread_id)} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {t.other_party?.avatar_url ? (
                      <img src={t.other_party.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(t.other_party?.display_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{t.other_party?.display_name ?? "—"}</p>
                      <span className="text-[11px] text-ink-300 dark:text-ink-600 shrink-0">{formatTime(t.last_message?.sent_at)}</span>
                    </div>
                    <p className="text-xs text-[#7F7F7F] truncate">
                      <span>{t.last_message?.body || "—"}</span><br />
                    </p>
                    <div className="text-[10px] flex items-center justify-between text-[#7F7F7F] truncate">
                      <span>{t.product?.name}</span>
                      {t.unread_count > 0 && <div className="flex justify-center items-end">
                        <span className="text-[7px] w-[11px] h-[11px] flex items-center justify-center dark:text-black text-white rounded-full bg-brand-600">{t.unread_count}</span>
                      </div>}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteChat(t.thread_id)}
                  disabled={deletingId === t.thread_id}
                  title="Удалить чат"
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
                  <p className="text-xs flex items-center gap-1 text-success-600 dark:text-success-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Онлайн
                  </p>
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
                  Начните переписку
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
                          <span className="text-sm truncate">{m.body || "Файл"}</span>
                        </a>
                      ) : (
                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-700 dark:text-ink-200"
                            }`}
                        >
                          {m.body}
                        </div>
                      )}
                      <span className="text-[11px] text-ink-300 dark:text-ink-600 mt-1">{formatTime(m.sent_at)}</span>
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
              <input ref={attachInputRef} type="file" className="hidden" onChange={handleAttach} />
              <button
                onClick={() => attachInputRef.current?.click()}
                disabled={attaching}
                className="text-[#75809F] hover:text-[#1A94FF] disabled:opacity-50 transition-colors shrink-0"
                type="button"
                title="Прикрепить файл"
              >
                <Paperclip2 size={22} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Сообщение"
                className="flex-1 min-w-0 bg-transparent text-base outline-none placeholder:text-[#75809F] text-ink-900 dark:text-white"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="text-[#1A94FF] hover:text-brand-700 disabled:opacity-40 transition-colors p-1 shrink-0" type="button">
                <Send size={24} variant="Bold" />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-ink-400 dark:text-ink-500 text-sm">
            Выберите чат
          </div>
        )}
      </div>
    </div>
  );
}

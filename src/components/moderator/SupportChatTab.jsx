import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Send, TickCircle, SearchNormal1, ArrowLeft2 } from "iconsax-reactjs";
import { useAuth } from "../../context/AuthContext";
import { getAdminSupportChats, getSupportChatMessages, assignSupportChat, closeSupportChat } from "../../api/api";
import {
  connectSupportChatSocket,
  disconnectSupportChatSocket,
  subscribeSupportThread,
  sendSupportChatMessage,
  sendSupportTyping,
  sendSupportRead,
  onSupportChatEvent,
  confirmSupportChatSend,
} from "../../api/supportChatSocket";

const FILTERS = [
  { value: "", labelKey: "moderator.supportFilterAll" },
  { value: "OPEN", labelKey: "moderator.supportFilterOpen" },
  { value: "ASSIGNED", labelKey: "moderator.supportFilterAssigned" },
  { value: "CLOSED", labelKey: "moderator.supportFilterClosed" },
];

const STATUS_BADGE = {
  OPEN: "bg-warning-500/15 text-warning-600 dark:text-warning-400",
  ASSIGNED: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  CLOSED: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-400",
};

const STATUS_LABEL_KEYS = {
  OPEN: "moderator.supportFilterOpen",
  ASSIGNED: "moderator.supportFilterAssigned",
  CLOSED: "moderator.supportFilterClosed",
};

const TYPING_THROTTLE_MS = 2500;
const TYPING_EXPIRE_MS = 4000;
const QUEUE_POLL_MS = 8000;

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function initials(text) {
  const parts = (text ?? "").trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "?";
}

export default function SupportChatTab() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const roleUpper = (user?.role || "").toUpperCase();
  const isSuperAdmin = roleUpper.includes("SUPER_ADMIN");

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(true);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((th) => {
      const haystack = [th.subject, String(th.requester_id ?? ""), th.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [threads, search]);

  const activeThreadRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const loadThreads = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setThreadsLoading(true);
    try {
      const data = await getAdminSupportChats({ status: filter || undefined, per_page: 50 });
      const items = data?.items ?? [];
      setThreads(items);
      items.forEach((th) => {
        if (th.status === "ASSIGNED" && th.assigned_admin_id === user?.id) {
          subscribeSupportThread(th.thread_id);
        }
      });
    } catch {
      if (!silent) setThreads([]);
    } finally {
      if (!silent) setThreadsLoading(false);
    }
  }, [filter, user?.id]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const id = setInterval(() => loadThreads({ silent: true }), QUEUE_POLL_MS);
    return () => clearInterval(id);
  }, [loadThreads]);

  useEffect(() => {
    connectSupportChatSocket(i18n.language || "uz");
    return () => disconnectSupportChatSocket();
  }, [i18n.language]);

  useEffect(() => {
    const offOpen = onSupportChatEvent("open", () => setSocketConnected(true));
    const offClose = onSupportChatEvent("close", () => setSocketConnected(false));

    const offMessage = onSupportChatEvent("new_message", ({ thread_id, message }) => {
      if (!message) return;
      const isMine = message.sender_id === user?.id;

      if (thread_id === activeThreadRef.current?.thread_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          if (isMine) {
            const pendingIdx = prev.findIndex((m) => m._optimistic && m.status !== "failed");
            if (pendingIdx !== -1) {
              confirmSupportChatSend(prev[pendingIdx].id);
              const copy = prev.slice();
              copy[pendingIdx] = message;
              return copy;
            }
          }
          return [...prev, message];
        });
        if (!isMine) sendSupportRead(thread_id, [message.id]);
        setOtherTyping(false);
      }

      setThreads((prev) => prev.map((th) => (th.thread_id === thread_id ? { ...th, last_message_at: message.sent_at } : th)));
    });

    const offRead = onSupportChatEvent("read_receipt", ({ thread_id, message_ids }) => {
      if (thread_id !== activeThreadRef.current?.thread_id || !message_ids?.length) return;
      setMessages((prev) => prev.map((m) => (message_ids.includes(m.id) ? { ...m, status: "read" } : m)));
    });

    const offTyping = onSupportChatEvent("typing", ({ thread_id, user_id }) => {
      if (thread_id !== activeThreadRef.current?.thread_id || user_id === user?.id) return;
      setOtherTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), TYPING_EXPIRE_MS);
    });

    const offError = onSupportChatEvent("error", (data) => {
      console.error("[supportChat admin] socket error", data);
    });

    const offSendTimeout = onSupportChatEvent("send_timeout", ({ client_id }) => {
      if (!client_id) return;
      setMessages((prev) => prev.map((m) => (m.id === client_id ? { ...m, status: "failed" } : m)));
    });

    return () => {
      offOpen();
      offClose();
      offMessage();
      offRead();
      offTyping();
      offError();
      offSendTimeout();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canChatWith = (th) => th?.status === "ASSIGNED" && th.assigned_admin_id === user?.id;
  const hasThreadAccess = (th) => !!th?.assigned_admin_id && th.assigned_admin_id === user?.id;

  const selectThread = async (th) => {
    setActiveThread(th);
    setMobileShowChat(true);
    setMessages([]);
    setOtherTyping(false);
    if (th.status === "OPEN" || !hasThreadAccess(th)) return;
    setMessagesLoading(true);
    try {
      const data = await getSupportChatMessages(th.thread_id, { per_page: 30 });
      const items = (data?.items ?? []).slice().reverse();
      setMessages(items);
      if (canChatWith(th)) {
        subscribeSupportThread(th.thread_id);
        const unreadIds = items.filter((m) => m.sender_id !== user?.id && m.status !== "read").map((m) => m.id);
        if (unreadIds.length) sendSupportRead(th.thread_id, unreadIds);
      }
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleAssign = async (th) => {
    setAssigning(true);
    try {
      const updated = await assignSupportChat(th.thread_id);
      setThreads((prev) => prev.map((t) => (t.thread_id === updated.thread_id ? { ...t, status: updated.status, assigned_admin_id: updated.assigned_admin_id, assigned_admin_role: updated.assigned_admin_role } : t)));
      const merged = { ...th, status: updated.status, assigned_admin_id: updated.assigned_admin_id, assigned_admin_role: updated.assigned_admin_role };
      await selectThread(merged);
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = async () => {
    if (!activeThread) return;
    if (!window.confirm(t("moderator.confirmCloseSupportChat"))) return;
    setClosing(true);
    try {
      await closeSupportChat(activeThread.thread_id);
      setThreads((prev) => prev.map((t) => (t.thread_id === activeThread.thread_id ? { ...t, status: "CLOSED" } : t)));
      setActiveThread((prev) => (prev ? { ...prev, status: "CLOSED" } : prev));
    } catch (err) {
      alert(err.message);
    } finally {
      setClosing(false);
    }
  };

  const sendMessage = (body) => {
    const threadId = activeThread?.thread_id;
    if (!threadId || !body?.trim()) return;
    const trimmed = body.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      body: trimmed,
      thread_id: threadId,
      sender_id: user?.id,
      sent_at: new Date().toISOString(),
      status: "sending",
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    sendSupportChatMessage(threadId, trimmed, optimisticId);
  };

  const retryMessage = (id) => {
    const threadId = activeThread?.thread_id;
    const msg = messages.find((m) => m.id === id);
    if (!threadId || !msg) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sending" } : m)));
    sendSupportChatMessage(threadId, msg.body, id);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const threadId = activeThread?.thread_id;
    if (!threadId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now;
      sendSupportTyping(threadId);
    }
  };

  const canClose = activeThread?.status === "ASSIGNED" && (isSuperAdmin || activeThread.assigned_admin_id === user?.id);

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] grid grid-cols-1 md:grid-cols-[280px_1fr] overflow-hidden h-[560px] sm:h-[600px] transition-colors">
      <div className={`border-r border-ink-100 dark:border-[#1C1C1C] flex min-h-0 flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 pt-4">
          <div className="pb-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4">{t("moderator.tabSupport")}</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2 bg-white dark:bg-[#0D0D0D] border dark:border-[#2D2D2D] rounded-2xl px-3 py-2.5 mb-3">
              <SearchNormal1 size={16} className="text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chat.searchMessages")}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
              />
            </div>
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${filter === f.value ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-500 dark:text-ink-400"
                    }`}
                >
                  {t(f.labelKey)}
                </button>
              ))}
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
            <div className="flex flex-col items-center justify-center h-full text-ink-400 dark:text-ink-500 text-sm text-center px-4">
              {t("moderator.supportQueueEmpty")}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ink-400 dark:text-ink-500 text-sm text-center px-4">
              {t("chat.noSearchResults")}
            </div>
          ) : (
            filteredThreads.map((th) => {
              const isActive = activeThread?.thread_id === th.thread_id;
              const mine = th.assigned_admin_id === user?.id;
              const label = th.subject || t("chat.supportTitle");
              return (
                <div
                  key={th.thread_id}
                  className={`group w-full flex mt-4 items-center gap-3 p-2 text-left border rounded-xl border-ink-50 dark:border-[#1C1C1C]/60 transition-colors ${isActive ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-[#171717]"
                    }`}
                >
                  <button onClick={() => selectThread(th)} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                    <div className="w-10 h-10 rounded-full bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                      {initials(label)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{label}</p>
                        <span className="text-[11px] text-ink-300 dark:text-ink-600 shrink-0">{formatDateTime(th.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-[#7F7F7F] truncate">
                        {t(th.requester_role === "SELLER" ? "moderator.roleSeller" : "moderator.roleBuyer")} · #{th.requester_id}
                      </p>
                      <div className="text-[10px] flex items-center justify-between truncate mt-0.5">
                        <span className={`font-semibold px-1.5 py-0.5 rounded ${STATUS_BADGE[th.status] ?? ""}`}>{t(STATUS_LABEL_KEYS[th.status] ?? "moderator.supportFilterAll")}</span>
                        {mine && th.status === "ASSIGNED" && (
                          <span className="text-brand-600 dark:text-brand-400 font-medium">{t("moderator.assignedToMe")}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={`min-h-0 flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {!activeThread ? (
          <div className="hidden md:flex flex-1 items-center justify-center text-ink-400 dark:text-ink-500 text-sm">{t("chat.selectChat")}</div>
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between p-4 border-b border-ink-100 dark:border-[#1C1C1C]">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden text-ink-500 dark:text-ink-300 shrink-0">
                  <ArrowLeft2 size={20} />
                </button>
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                  {initials(activeThread.subject || t("chat.supportTitle"))}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{activeThread.subject || t("chat.supportTitle")}</p>
                  {activeThread.status === "CLOSED" ? (
                    <p className="text-xs text-ink-400">{t("moderator.supportFilterClosed")}</p>
                  ) : activeThread.status === "OPEN" ? (
                    <p className="text-xs text-warning-600 dark:text-warning-400">{t("moderator.supportFilterOpen")}</p>
                  ) : otherTyping ? (
                    <p className="text-xs text-brand-500 dark:text-brand-400">{t("chat.typing")}</p>
                  ) : socketConnected ? (
                    <p className="text-xs flex items-center gap-1 text-success-600 dark:text-success-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> {t("chat.online")}
                    </p>
                  ) : (
                    <p className="text-xs flex items-center gap-1 text-danger-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger-500" /> {t("chat.reconnecting")}
                    </p>
                  )}
                </div>
              </div>
              {canClose && (
                <button
                  onClick={handleClose}
                  disabled={closing}
                  className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-danger-500 hover:bg-danger-600 disabled:opacity-50 text-white transition-colors"
                >
                  {t("moderator.closeSupportChat")}
                </button>
              )}
            </div>

            {activeThread.status === "OPEN" ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-ink-400 dark:text-ink-500">{t("moderator.supportAssignPrompt")}</p>
                <button
                  onClick={() => handleAssign(activeThread)}
                  disabled={assigning}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  <TickCircle size={18} /> {t("moderator.assignToMe")}
                </button>
              </div>
            ) : !hasThreadAccess(activeThread) ? (
              <div className="flex-1 flex items-center justify-center text-ink-400 dark:text-ink-500 text-sm text-center px-6">
                {t("moderator.supportAssignedToOther")}
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
                  {messagesLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className="h-10 w-40 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                      </div>
                    ))
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-ink-400 dark:text-ink-500 text-sm">{t("chat.startConversation")}</div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender_id === user?.id || m._optimistic;
                      return (
                        <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-700 dark:text-ink-200"
                              }`}
                          >
                            {m.body}
                          </div>
                          <span className="flex items-center gap-1 text-[11px] text-ink-300 dark:text-ink-600 mt-1">
                            {formatTime(m.sent_at)}
                            {isMine && m.status === "failed" && (
                              <button type="button" onClick={() => retryMessage(m.id)} title={t("chat.sendFailedRetry")} className="text-danger-500 text-[11px] font-bold hover:underline">
                                !
                              </button>
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {activeThread.status !== "CLOSED" && (
                  <div className="flex shrink-0 items-center gap-4 px-4 sm:px-6 py-4 border-t border-ink-100 dark:border-[#1C1C1C]">
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
                    <button onClick={handleSend} disabled={!input.trim()} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-40 transition-colors p-1 shrink-0" type="button">
                      <Send size={24} variant="Bold" />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

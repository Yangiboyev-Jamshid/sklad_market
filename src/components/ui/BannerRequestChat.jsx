import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseCircle, Send } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { createBannerChat, getSupportChatMessages } from "../../api/api";
import {
  connectSupportChatSocket,
  subscribeSupportThread,
  sendSupportChatMessage,
  sendSupportTyping,
  sendSupportRead,
  onSupportChatEvent,
  confirmSupportChatSend,
} from "../../api/supportChatSocket";

const TYPING_THROTTLE_MS = 2500;
const TYPING_EXPIRE_MS = 4000;

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function MessageStatus({ status, onRetry, retryTitle }) {
  if (status === "failed") {
    return (
      <button type="button" onClick={onRetry} title={retryTitle} className="text-danger-500 text-[11px] font-bold hover:underline cursor-pointer">
        !
      </button>
    );
  }
  if (status === "read") return <span className="text-brand-400 text-[11px]">✓✓</span>;
  if (status === "delivered") return <span className="text-ink-300 dark:text-ink-600 text-[11px]">✓✓</span>;
  if (status === "sending") return null;
  return <span className="text-ink-300 dark:text-ink-600 text-[11px]">✓</span>;
}

export default function BannerRequestChat({ open, onClose, banner }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [thread, setThread] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(true);

  const threadRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initStartedRef = useRef(false);
  const autoSentRef = useRef(false);

  useEffect(() => {
    threadRef.current = thread;
  }, [thread]);

  const sendMessage = useCallback((body) => {
    const threadId = threadRef.current?.thread_id;
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
  }, [user?.id]);

  const loadMessages = useCallback(async (threadId) => {
    setMessagesLoading(true);
    try {
      const data = await getSupportChatMessages(threadId, { per_page: 30 });
      const items = (data?.items ?? []).slice().reverse();
      setMessages(items);
      const unreadIds = items.filter((m) => m.sender_id !== user?.id && m.status !== "read").map((m) => m.id);
      if (unreadIds.length) sendSupportRead(threadId, unreadIds);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.id]);

  const initThread = useCallback(async () => {
    setInitializing(true);
    setInitError(false);
    try {
      const data = await createBannerChat({ subject: t("chat.bannerRequestTitle") + (banner?.id != null ? ` #${banner.id}` : "") });
      setThread(data);
      connectSupportChatSocket(i18n.language || "uz");
      subscribeSupportThread(data.thread_id);
      await loadMessages(data.thread_id);
      const isNewThread = data.is_new ?? data.new;
      if (isNewThread && !autoSentRef.current) {
        autoSentRef.current = true;
        sendMessage(t("chat.bannerRequestAutoMessage"));
      }
    } catch {
      setInitError(true);
    } finally {
      setInitializing(false);
    }
  }, [i18n.language, loadMessages, sendMessage, t, banner]);

  useEffect(() => {
    if (open && !initStartedRef.current) {
      initStartedRef.current = true;
      initThread();
    }
  }, [open, initThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return undefined;

    const offOpen = onSupportChatEvent("open", () => setSocketConnected(true));
    const offClose = onSupportChatEvent("close", () => setSocketConnected(false));

    const offMessage = onSupportChatEvent("new_message", ({ thread_id, message }) => {
      if (!message || thread_id !== threadRef.current?.thread_id) return;
      const isMine = message.sender_id === user?.id;
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
    });

    const offRead = onSupportChatEvent("read_receipt", ({ thread_id, message_ids }) => {
      if (thread_id !== threadRef.current?.thread_id || !message_ids?.length) return;
      setMessages((prev) => prev.map((m) => (message_ids.includes(m.id) ? { ...m, status: "read" } : m)));
    });

    const offTyping = onSupportChatEvent("typing", ({ thread_id, user_id }) => {
      if (thread_id !== threadRef.current?.thread_id || user_id === user?.id) return;
      setOtherTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), TYPING_EXPIRE_MS);
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
      offSendTimeout();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [open, user?.id]);

  const threadClosed = thread?.status === "CLOSED";

  const retryMessage = (id) => {
    const threadId = thread?.thread_id;
    const msg = messages.find((m) => m.id === id);
    if (!threadId || !msg) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sending" } : m)));
    sendSupportChatMessage(threadId, msg.body, id);
  };

  const handleSend = () => {
    if (!input.trim() || threadClosed) return;
    sendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const threadId = thread?.thread_id;
    if (!threadId || threadClosed) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now;
      sendSupportTyping(threadId);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0D0D] rounded-t-xl sm:rounded-3xl w-full sm:max-w-sm max-h-[92vh] sm:max-h-[600px] overflow-hidden flex flex-col relative"
          >
            <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-[#1C1C1C]">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{t("chat.bannerRequestTitle")}</p>
                {!initializing && !initError && (
                  otherTyping ? (
                    <span className="text-[11px] text-brand-500 dark:text-brand-400">{t("chat.typing")}</span>
                  ) : socketConnected ? (
                    <span className="text-[11px] flex items-center gap-1 text-success-600 dark:text-success-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-500" /> {t("chat.online")}
                    </span>
                  ) : (
                    <span className="text-[11px] flex items-center gap-1 text-danger-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger-500" /> {t("chat.reconnecting")}
                    </span>
                  )
                )}
              </div>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors shrink-0" aria-label={t("common.close")}>
                <CloseCircle size={22} variant="Linear" />
              </button>
            </div>

            {initError ? (
              <div className="flex flex-col items-center text-center gap-3 px-6 py-10">
                <p className="font-semibold text-ink-900 dark:text-white">{t("chat.temporarilyUnavailable")}</p>
                <button onClick={initThread} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  {t("chat.retry")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col min-h-0" style={{ height: 420 }}>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {initializing || messagesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className="h-9 w-36 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                      </div>
                    ))
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-ink-400 dark:text-ink-500 text-sm text-center px-4">
                      {t("chat.startConversation")}
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender_id === user?.id || m._optimistic;
                      return (
                        <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-brand-600 text-white" : "bg-ink-50 dark:bg-[#171717] text-ink-700 dark:text-ink-200"
                              }`}
                          >
                            {m.body}
                          </div>
                          <span className="flex items-center gap-1 text-[11px] text-ink-300 dark:text-ink-600 mt-1">
                            {formatTime(m.sent_at)}
                            {isMine && (
                              <MessageStatus status={m.status} onRetry={() => retryMessage(m.id)} retryTitle={t("chat.sendFailedRetry")} />
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {threadClosed ? (
                  <div className="shrink-0 flex flex-col items-center gap-2 px-4 py-3 border-t border-ink-100 dark:border-[#1C1C1C]">
                    <p className="text-xs text-ink-400 dark:text-ink-500">{t("chat.chatClosed")}</p>
                  </div>
                ) : (
                  <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-ink-100 dark:border-[#1C1C1C]">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      disabled={initializing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={t("chat.messagePlaceholder")}
                      className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[#75809F] text-ink-900 dark:text-white disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || initializing}
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-40 transition-colors p-1 shrink-0"
                      type="button"
                    >
                      <Send size={22} variant="Bold" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

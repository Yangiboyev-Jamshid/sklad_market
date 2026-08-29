import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Add, Trash, MessageQuestion, HamburgerMenu, CloseCircle } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import AppShell from "../components/layout/AppShell";
import AiDraftModal from "../components/ai/AiDraftModal";
import { createAiConversation, getAiConversations, getAiConversationMessages, deleteAiConversation, cancelAiDraft } from "../api/api";
import { streamAiMessage } from "../api/aiChatStream";
import { aiSuggestions } from "../data/mockData";

function extractDraftId(message) {
  if (!message?.toolPayload) return null;
  try {
    const parsed = typeof message.toolPayload === "string" ? JSON.parse(message.toolPayload) : message.toolPayload;
    return parsed?.draftId ?? parsed?.draft_id ?? null;
  } catch {
    return null;
  }
}

export default function AiAgentPage() {
  const { t } = useTranslation();

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draftModal, setDraftModal] = useState(null);
  const [draftStatuses, setDraftStatuses] = useState({});

  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);
  const activeIdRef = useRef(null);
  const localIdRef = useRef(0);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const data = await getAiConversations({ per_page: 50 });
      setConversations(data?.items ?? []);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (conversationId) => {
    setMessagesLoading(true);
    try {
      const data = await getAiConversationMessages(conversationId, { per_page: 50 });
      const items = (data?.items ?? []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(items);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const openConversation = (id) => {
    abortRef.current?.abort();
    setStreaming(false);
    setError("");
    setActiveId(id);
    setSidebarOpen(false);
    loadMessages(id);
  };

  const startNewConversation = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setError("");
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(t("ai.deleteConversationConfirm"))) return;
    try {
      await deleteAiConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) startNewConversation();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming) return;
    setInput("");
    setError("");

    let conversationId = activeIdRef.current;
    try {
      if (!conversationId) {
        const created = await createAiConversation({});
        conversationId = created.id;
        setActiveId(conversationId);
        setConversations((prev) => [created, ...prev]);
      }
    } catch (err) {
      setError(err.message || t("ai.errorGeneric"));
      return;
    }

    const userMessage = { id: `local-${localIdRef.current++}`, role: "user", content: trimmed, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);

    const assistantId = `assistant-${localIdRef.current++}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString(), _streaming: true }]);
    setStreaming(true);

    let text_ = "";
    const controller = new AbortController();
    abortRef.current = controller;

    await streamAiMessage(conversationId, trimmed, {
      signal: controller.signal,
      onToken: (chunk) => {
        text_ += chunk;
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text_ } : m)));
      },
      onDone: async (payload) => {
        setStreaming(false);
        try {
          const data = await getAiConversationMessages(conversationId, { per_page: 5 });
          const serverMsg = (data?.items ?? []).find((m) => m.id === payload?.messageId);
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? (serverMsg ?? { ...m, _streaming: false }) : m)));
        } catch {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, _streaming: false } : m)));
        }
        loadConversations();
      },
      onError: (err) => {
        setStreaming(false);
        setError(err.message || t("ai.errorGeneric"));
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, _streaming: false } : m)));
      },
    });
  };

  const handleSend = () => send();

  const handleDraftConfirmed = () => {
    if (draftModal) setDraftStatuses((prev) => ({ ...prev, [draftModal]: "confirmed" }));
    setDraftModal(null);
  };

  const handleDraftCancel = async (draftId) => {
    try {
      await cancelAiDraft(draftId);
    } catch {
      // ignore, still mark cancelled locally
    }
    setDraftStatuses((prev) => ({ ...prev, [draftId]: "cancelled" }));
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)]">
        <div className={`w-72 shrink-0 border-r border-ink-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] flex-col ${sidebarOpen ? "fixed inset-0 z-40 flex" : "hidden md:flex"}`}>
          <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <p className="font-semibold text-ink-900 dark:text-white">{t("ai.conversations")}</p>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-ink-400">
              <CloseCircle size={20} />
            </button>
          </div>
          <div className="p-3">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
            >
              <Add size={18} /> {t("ai.newChat")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {conversationsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse mb-2" />
              ))
            ) : conversations.length === 0 ? (
              <p className="text-sm text-ink-400 text-center mt-6">{t("ai.noConversations")}</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${activeId === c.id ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-ink-50 dark:hover:bg-[#171717]"}`}
                >
                  <MessageQuestion size={16} className="text-ink-400 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm text-ink-700 dark:text-ink-200">{c.title || t("ai.newChat")}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    title={t("ai.deleteConversation")}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger-500 transition-opacity"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-ink-100 dark:border-[#1C1C1C]">
            <button onClick={() => setSidebarOpen(true)} className="text-ink-500 dark:text-ink-300">
              <HamburgerMenu size={20} />
            </button>
            <span className="text-sm font-medium text-ink-900 dark:text-white">{t("ai.pageTitle")}</span>
          </div>

          <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 min-h-0 px-4 sm:px-6 py-5 sm:py-8">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {messages.length === 0 && !messagesLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-3">{t("ai.greetingTitle")}</h1>
                  <p className="text-[#8D8D8D] mb-8 max-w-lg text-lg sm:text-xl">{t("ai.pageSubtitle")}</p>
                  <div className="grid sm:grid-cols-2 grid-cols-1 justify-center gap-3 w-full">
                    {aiSuggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => send(s)}
                        className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-4 py-5 sm:py-3 text-xs sm:text-sm text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-2">
                  {messagesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <div className="h-10 w-48 rounded-2xl bg-ink-100 dark:bg-[#1C1C1C] animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((m) => {
                        const isMine = m.role === "user";
                        const draftId = extractDraftId(m);
                        const draftStatus = draftId ? draftStatuses[draftId] : null;
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isMine
                                ? "bg-brand-600 text-white"
                                : "bg-white dark:bg-[#0D0D0D] border border-ink-100 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200"
                                }`}
                            >
                              {m.content || (m._streaming ? "…" : "")}
                            </div>
                            {draftId && !draftStatus && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => setDraftModal(draftId)}
                                  className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl transition-colors"
                                >
                                  {t("ai.draftConfirmButton")}
                                </button>
                                <button
                                  onClick={() => handleDraftCancel(draftId)}
                                  className="text-xs font-medium border border-ink-200 dark:border-[#1C1C1C] text-ink-600 dark:text-ink-300 px-3 py-2 rounded-xl hover:border-danger-300 hover:text-danger-500 transition-colors"
                                >
                                  {t("ai.draftCancelButton")}
                                </button>
                              </div>
                            )}
                            {draftStatus === "confirmed" && (
                              <p className="text-xs text-success-600 dark:text-success-400 mt-2">{t("ai.draftConfirmedMsg")}</p>
                            )}
                            {draftStatus === "cancelled" && (
                              <p className="text-xs text-ink-400 mt-2">{t("ai.draftCanceledMsg")}</p>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 mt-2">
                {error}
              </p>
            )}

            <div className="sticky bottom-5 flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 mt-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !streaming && handleSend()}
                placeholder={t("ai.placeholder")}
                disabled={streaming}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send size={20} variant="Bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AiDraftModal
        open={!!draftModal}
        draftId={draftModal}
        onClose={() => setDraftModal(null)}
        onConfirmed={handleDraftConfirmed}
      />
    </AppShell>
  );
}

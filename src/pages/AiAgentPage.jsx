import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Add, Trash, MessageQuestion, HamburgerMenu, CloseCircle, TickCircle, Building3, Box1 } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import AppShell from "../components/layout/AppShell";
import AiDraftModal from "../components/ai/AiDraftModal";
import AiRequestsNavLink from "../components/ai/AiRequestsNavLink";
import ProductThumb from "../components/ui/ProductThumb";
import { useAuth } from "../context/AuthContext";
import { createAiConversation, getAiConversations, getAiConversationMessages, deleteAiConversation, cancelAiDraft } from "../api/api";
import { streamAiMessage } from "../api/aiChatStream";
import { aiSuggestions } from "../data/mockData";

const MAX_INPUT_LENGTH = 4000;

const AI_ERROR_MESSAGE_KEYS = {
  rate_limited: "ai.errorRateLimited",
  budget_exceeded: "ai.errorBudgetExceeded",
  provider_error: "ai.errorProviderError",
  timeout: "ai.errorTimeout",
  invalid_input: "ai.errorInvalidInput",
};

function aiErrorMessage(err, t) {
  const key = AI_ERROR_MESSAGE_KEYS[err?.code];
  if (key) return t(key);
  if (err?.status === 401) return t("ai.errorGeneric");
  return err?.message || t("ai.errorGeneric");
}

function parseToolPayload(message) {
  if (!message?.toolPayload) return null;
  try {
    return typeof message.toolPayload === "string" ? JSON.parse(message.toolPayload) : message.toolPayload;
  } catch {
    return null;
  }
}

function draftIdFromToolPayload(message) {
  const parsed = parseToolPayload(message);
  return parsed?.draftRef?.draftId ?? parsed?.draftId ?? parsed?.draft_id ?? null;
}

function resultItemsFromToolPayload(message) {
  const parsed = parseToolPayload(message);
  const fromEnvelope = normalizeResultItems(parsed?.resultSet);
  return fromEnvelope.length > 0 ? fromEnvelope : normalizeResultItems(parsed);
}

function normalizeResultItems(payload) {
  const raw = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it) => it && typeof it === "object" && it.slug && it.name)
    .map((it) => ({
      type: it.type === "COMPANY" || it.logoUrl || it.productCount != null ? "COMPANY" : "PRODUCT",
      id: it.id ?? it.productId ?? it.companyId,
      slug: it.slug,
      name: it.name,
      image: it.imageUrl ?? it.logoUrl ?? null,
      price: it.price,
      currency: it.currency,
      productCount: it.productCount,
    }));
}

export default function AiAgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      const sorted = (data?.items ?? [])
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const items = [];
      let pendingResultSets = [];
      let pendingDraftId = null;
      for (const m of sorted) {
        if (String(m.role || "").toUpperCase() === "TOOL") {
          const resultItems = resultItemsFromToolPayload(m);
          if (resultItems.length > 0) pendingResultSets = [...pendingResultSets, resultItems];
          pendingDraftId = draftIdFromToolPayload(m) ?? pendingDraftId;
          continue;
        }
        const enriched = { ...m };
        if (String(m.role || "").toUpperCase() === "ASSISTANT") {
          const ownResultItems = resultItemsFromToolPayload(m);
          enriched.resultSets = pendingResultSets.length > 0 ? pendingResultSets : (ownResultItems.length > 0 ? [ownResultItems] : []);
          enriched.draftId = pendingDraftId ?? draftIdFromToolPayload(m);
          pendingResultSets = [];
          pendingDraftId = null;
        }
        items.push(enriched);
      }
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
    const trimmed = (text ?? input).trim().slice(0, MAX_INPUT_LENGTH);
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
      setError(aiErrorMessage(err, t));
      return;
    }

    const userMessage = { id: `local-${localIdRef.current++}`, role: "user", content: trimmed, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);

    const assistantId = `assistant-${localIdRef.current++}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString(), _streaming: true, toolEvents: [], resultSets: [], draftId: null },
    ]);
    setStreaming(true);

    let text_ = "";
    const controller = new AbortController();
    abortRef.current = controller;

    const updateAssistant = (updater) => {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? updater(m) : m)));
    };

    await streamAiMessage(conversationId, trimmed, {
      signal: controller.signal,
      onToken: (chunk) => {
        text_ += chunk;
        updateAssistant((m) => ({ ...m, content: text_ }));
      },
      onToolStart: (payload) => {
        updateAssistant((m) => ({ ...m, toolEvents: [...(m.toolEvents ?? []), { tool: payload?.tool, summary: payload?.summary, status: "running" }] }));
      },
      onToolEnd: (payload) => {
        updateAssistant((m) => ({
          ...m,
          toolEvents: (m.toolEvents ?? []).map((te) => (te.tool === payload?.tool && te.status === "running" ? { ...te, status: payload?.status || "ok" } : te)),
        }));
      },
      onResultSet: (payload) => {
        const items = normalizeResultItems(payload);
        if (!items.length) return;
        updateAssistant((m) => ({ ...m, resultSets: [...(m.resultSets ?? []), items] }));
      },
      onDraft: (payload) => {
        if (!payload?.draftId) return;
        updateAssistant((m) => ({ ...m, draftId: payload.draftId, draftType: payload.type }));
      },
      onDone: (payload) => {
        setStreaming(false);
        updateAssistant((m) => ({ ...m, _streaming: false, id: payload?.messageId ?? m.id }));
        loadConversations();
      },
      onError: (err) => {
        setStreaming(false);
        setError(aiErrorMessage(err, t));
        updateAssistant((m) => ({ ...m, _streaming: false }));
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

    }
    setDraftStatuses((prev) => ({ ...prev, [draftId]: "cancelled" }));
  };

  const sidebarContent = (
    <>
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
    </>
  );

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)]">
        <div className="hidden md:flex w-72 shrink-0 border-r border-ink-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] flex-col">
          {sidebarContent}
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="ai-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-ink-900/50 backdrop-blur-sm md:hidden"
              />
              <motion.div
                key="ai-sidebar-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="w-72 shrink-0 border-r border-ink-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] flex flex-col fixed inset-y-0 left-0 z-40 md:hidden"
              >
                {sidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden flex items-center px-4 py-2.5 border-b border-ink-100 dark:border-[#1C1C1C]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-ink-300"
            >
              <HamburgerMenu size={16} />
              {t("ai.conversations")}
            </button>
          </div>

          <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 min-h-0 px-4 sm:px-6 py-5 sm:py-8">
            <div className="flex justify-end mb-3">
              <AiRequestsNavLink role={user?.role} />
            </div>
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
                        className={`bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-4 py-5 sm:py-3 text-xs sm:text-sm text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ${i === 4 ? "sm:col-span-2" : ""}`}
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
                        const isMine = String(m.role || "").toUpperCase() === "USER";
                        const draftId = m.draftId ?? null;
                        const draftStatus = draftId ? draftStatuses[draftId] : null;
                        const isThinking = m._streaming && !m.content && !(m.toolEvents?.length);
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
                              {!isMine && m.toolEvents?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {m.toolEvents.map((te, i) => (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${te.status === "running"
                                        ? "border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400"
                                        : "border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400"
                                        }`}
                                    >
                                      {te.status === "running" ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                      ) : (
                                        <TickCircle size={12} />
                                      )}
                                      {te.summary || te.tool}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isThinking ? (
                                <span className="inline-flex gap-1 items-center text-ink-400" aria-label={t("ai.thinking")}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                                </span>
                              ) : (
                                m.content
                              )}

                              {!isMine && m.resultSets?.length > 0 && (
                                <div className="flex flex-col gap-2 mt-3">
                                  {m.resultSets.map((items, si) => (
                                    <div key={si} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {items.map((it) => (
                                        <button
                                          key={`${it.type}-${it.id}`}
                                          type="button"
                                          onClick={() => navigate(it.type === "COMPANY" ? `/company/${it.slug}` : `/product/${it.slug}`)}
                                          className="flex flex-col gap-1.5 text-left bg-ink-50 dark:bg-[#171717] border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-2 hover:border-brand-300 dark:hover:border-brand-500 transition-colors"
                                        >
                                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#EBEBEB] dark:bg-[#2A2A2A] flex items-center justify-center">
                                            {it.image ? (
                                              <img src={it.image} alt="" className="w-full h-full object-cover" />
                                            ) : it.type === "COMPANY" ? (
                                              <Building3 size={20} className="text-ink-400" />
                                            ) : (
                                              <ProductThumb />
                                            )}
                                          </div>
                                          <p className="text-xs font-medium text-ink-900 dark:text-white line-clamp-2">{it.name}</p>
                                          <p className="text-[11px] text-ink-400 dark:text-ink-500 flex items-center gap-1">
                                            {it.type === "COMPANY" ? (
                                              <>
                                                <Building3 size={11} /> {it.productCount ?? 0} {t("ai.productsLabel")}
                                              </>
                                            ) : (
                                              <>
                                                <Box1 size={11} /> {Number(it.price ?? 0).toLocaleString()} {it.currency}
                                              </>
                                            )}
                                          </p>
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
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

            <div className="sticky bottom-5 flex flex-col gap-1 mt-4">
              <div className="flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-3 sm:py-3.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
                  onKeyDown={(e) => e.key === "Enter" && !streaming && handleSend()}
                  placeholder={t("ai.placeholder")}
                  disabled={streaming}
                  maxLength={MAX_INPUT_LENGTH}
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
              {input.length > MAX_INPUT_LENGTH * 0.8 && (
                <span className="text-[11px] text-ink-400 self-end pr-1">{input.length}/{MAX_INPUT_LENGTH}</span>
              )}
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

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "iconsax-reactjs";
import { Link, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { aiSuggestions } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { isAiAgentEnabled } from "../ai/flag";
import { useAiChat } from "../ai/hooks/useAiChat";
import { t, useAiLocale } from "../ai/i18n";
import Suggestions from "../ai/components/Suggestions";
import ChatMessages from "../ai/components/ChatMessages";
import ChatInput from "../ai/components/ChatInput";
import ErrorCard from "../ai/components/ErrorCard";
import SellerListingHelper from "../ai/components/SellerListingHelper";
import AiAgentLogo from "../ai/components/AiAgentLogo";
import AiRateLimitAdminPanel from "../ai/components/AiRateLimitAdminPanel";
import AiConversationHistory from "../ai/components/AiConversationHistory";

const AI_REPLY_DELAY_MS = 700;

function normalizeRole(role) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

function preferredName(user) {
  const value = user?.firstName || user?.name || user?.username;
  return String(value || "").trim().split(/\s+/)[0];
}

function aiSessionKey(user) {
  const role = normalizeRole(user?.role);
  if (!role) return null;
  const identity = user?.username
    ? `username:${user.username}`
    : user?.id != null
      ? `id:${user.id}`
      : null;
  return identity ? `${identity}|role:${role}` : null;
}

function jwtPayload(token) {
  if (typeof token !== "string") return null;
  const encoded = token.split(".")[1];
  if (!encoded) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function jwtSession(token) {
  const payload = jwtPayload(token);
  const subject = typeof payload?.sub === "string" && payload.sub ? payload.sub : null;
  const rawRoles = payload?.realm_access?.roles;
  const roles = Array.isArray(rawRoles)
    ? [...new Set(rawRoles.map(normalizeRole).filter(Boolean))].sort().join(",")
    : null;
  return { subject, roles: roles || null };
}

// Today's mock experience — kept byte-for-byte when VITE_FEATURE_AI_AGENT is off.
function MockAiAgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const replyTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, aiThinking]);

  useEffect(() => () => clearTimeout(replyTimeoutRef.current), []);

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((prev) => [...prev, { from: "me", text: t }]);
    setInput("");
    setAiThinking(true);
    clearTimeout(replyTimeoutRef.current);
    replyTimeoutRef.current = setTimeout(() => {
      setAiThinking(false);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Ищу подходящих поставщиков по вашему запросу. Один момент..." },
      ]);
    }, AI_REPLY_DELAY_MS);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto flex flex-col h-full px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-3">Здравствуйте</h1>
              <p className="text-[#8D8D8D] mb-8 sm:mb-8 max-w-lg text-xl sm:text-xl">
                Я ваш AI-ассистент. Ваш интеллектуальный помощник по поиску товаров и поставщиков.
              </p>
              <div className="grid sm:grid-cols-2 grid-cols-1 justify-center gap-3 sm:gap-3">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className={`${i === 4 ? "col-span-full" : ""}`}>
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => send(s)}
                      className={`bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-4 py-5 sm:py-3 text-xs sm:text-sm text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors`}
                    >
                      {s}
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.from === "me"
                      ? "bg-brand-600 text-white self-end"
                      : "bg-white dark:bg-[#0D0D0D] border border-ink-100 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 self-start"
                      }`}
                  >
                    {m.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="sticky bottom-5 flex items-center gap-2 bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Спросите что нибудь..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-400 dark:text-white"
          />
          <button onClick={() => send()} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors shrink-0">
            <Send size={20} variant="Bold" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function LoggedOutPrompt() {
  return (
    <AppShell>
      <div className="max-w-md mx-auto h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-ink-900 dark:text-white mb-3">
          {t("login.title")}
        </h1>
        <p className="text-[#8D8D8D] mb-8">{t("login.subtitle")}</p>
        <Link
          to="/login"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
        >
          {t("login.cta")}
        </Link>
      </div>
    </AppShell>
  );
}

function RealAiAgentPage() {
  const locale = useAiLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  // Username is present in both the cached login payload and refreshed user context. Role is part
  // of the session boundary too: a re-role must not retain cards, history, or unsent seller data.
  const accountKey = aiSessionKey(user);
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);
  const handleUnauthenticated = useCallback(() => logoutRef.current?.(), []);
  useEffect(() => {
    const handleCrossTabAuthChange = (event) => {
      if (event.key === null) {
        handleUnauthenticated();
        return;
      }
      if (event.key === "access_token") {
        if (event.newValue === null) {
          handleUnauthenticated();
          return;
        }
        const previousSession = jwtSession(event.oldValue);
        const nextSession = jwtSession(event.newValue);
        const subjectChanged =
          previousSession.subject &&
          nextSession.subject &&
          previousSession.subject !== nextSession.subject;
        const rolesChanged =
          previousSession.subject &&
          previousSession.subject === nextSession.subject &&
          Boolean(previousSession.roles || nextSession.roles) &&
          previousSession.roles !== nextSession.roles;
        if (subjectChanged || rolesChanged) {
          handleUnauthenticated();
        }
        return;
      }
      if (event.key !== "skladx_user") return;

      let nextAccountKey;
      try {
        const nextUser = event.newValue ? JSON.parse(event.newValue) : null;
        nextAccountKey = aiSessionKey(nextUser);
      } catch {
        nextAccountKey = null;
      }
      if (nextAccountKey !== accountKey) {
        // AuthContext does not currently hydrate cross-tab identity changes. Logging out this tab
        // prevents account A's conversation state from issuing requests as account B. A routine
        // same-account access-token rotation does not trigger this path.
        handleUnauthenticated();
      }
    };
    window.addEventListener("storage", handleCrossTabAuthChange);
    return () => window.removeEventListener("storage", handleCrossTabAuthChange);
  }, [accountKey, handleUnauthenticated]);
  const chat = useAiChat({ accountKey, onUnauthenticated: handleUnauthenticated });
  const [input, setInput] = useState("");
  const [showListingHelper, setShowListingHelper] = useState(false);
  const consumedPromptRef = useRef(null);
  const isSeller = normalizeRole(user?.role) === "SELLER";
  const name = preferredName(user);
  const sendChatMessage = chat.send;
  const startFreshConversation = chat.startFreshConversation;

  const interactionDisabled =
    !chat.accountReady ||
    chat.status === "streaming" ||
    chat.status === "hydrating" ||
    chat.error?.code === "history_unavailable";
  const sessionSwitchDisabled =
    !chat.accountReady || chat.status === "streaming" || chat.status === "hydrating";

  const handleSend = (text) => {
    const value = text ?? input;
    if (!accountKey || !value.trim()) return;
    sendChatMessage(value);
    setInput("");
  };

  const initialPrompt = String(searchParams.get("prompt") || "").trim().slice(0, 4000);
  const startNewChat = searchParams.get("new") === "1";
  useEffect(() => {
    const promptKey = `${startNewChat ? "new" : "continue"}:${initialPrompt}`;
    if (
      (!startNewChat && !initialPrompt) ||
      !accountKey ||
      (!startNewChat && initialPrompt && interactionDisabled) ||
      consumedPromptRef.current === promptKey
    ) return;
    consumedPromptRef.current = promptKey;
    if (startNewChat) startFreshConversation();
    if (initialPrompt) void sendChatMessage(initialPrompt);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("prompt");
    nextParams.delete("new");
    setSearchParams(nextParams, { replace: true });
  }, [
    accountKey,
    initialPrompt,
    interactionDisabled,
    searchParams,
    sendChatMessage,
    setSearchParams,
    startFreshConversation,
    startNewChat,
  ]);

  return (
    <AppShell
      contentClassName="lg:overflow-hidden"
      mainClassName="lg:flex lg:min-h-0 lg:flex-1 lg:overflow-hidden"
    >
      <div lang={locale} className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-white">
            <AiAgentLogo size={32} className="shadow-sm" />
            {t("greeting.badge")}
          </div>
          {isSeller && (
            <button
              type="button"
              onClick={() => setShowListingHelper((prev) => !prev)}
              aria-pressed={showListingHelper}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                showListingHelper
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-ink-200 dark:border-[#1C1C1C] text-ink-600 dark:text-ink-300 hover:border-brand-300 dark:hover:border-brand-500"
              }`}
            >
              {t("seller.entryLabel")}
            </button>
          )}
        </div>

        <div className="grid min-h-0 flex-1 items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
          <AiConversationHistory
            accountKey={accountKey}
            activeConversationId={chat.activeConversationId}
            chatStatus={chat.status}
            disabled={sessionSwitchDisabled}
            onNewChat={chat.startFreshConversation}
            onSelect={chat.selectConversation}
          />

          <div className="flex min-h-[36rem] min-w-0 flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
            {isSeller && showListingHelper && (
              <SellerListingHelper key={accountKey} onClose={() => setShowListingHelper(false)} />
            )}

            <AiRateLimitAdminPanel role={user?.role} />

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
              {chat.messages.length === 0 ? (
                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-ink-100 bg-gradient-to-b from-white to-brand-50/35 px-4 py-10 text-center dark:border-[#1C1C1C] dark:from-[#0D0D0D] dark:to-[#10172A]/60 sm:px-8">
                  <div className="pointer-events-none absolute -top-24 h-48 w-48 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/10" />
                  <div className="relative w-full max-w-3xl">
                    <AiAgentLogo size={56} className="mx-auto mb-5 shadow-lg shadow-brand-500/20" />
                    <h1 className="mb-3 font-display text-2xl font-bold text-ink-900 dark:text-white sm:text-3xl">
                      {name ? t("greeting.titleNamed", { name }) : t("greeting.title")}
                    </h1>
                    <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-ink-500 dark:text-ink-400 sm:text-lg">
                      {t("greeting.subtitle")}
                    </p>
                    <Suggestions
                      onSelect={handleSend}
                      role={user?.role}
                      disabled={interactionDisabled}
                    />
                  </div>
                </div>
              ) : (
                <ChatMessages
                  messages={chat.messages}
                  onConfirmDraft={chat.confirmDraft}
                  onCancelDraft={chat.cancelDraft}
                  onPublishIntent={chat.publishBuyingIntent}
                  onCloseIntent={chat.closeBuyingIntent}
                />
              )}
            </div>

            {chat.status === "error" && chat.error && (
              <ErrorCard
                error={chat.error}
                onRetry={
                  chat.error.code === "history_unavailable" ? chat.retryHistory : chat.retryLast
                }
                onStartFresh={
                  chat.error.code === "history_unavailable"
                    ? chat.startFreshConversation
                    : undefined
                }
              />
            )}

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => handleSend()}
              disabled={interactionDisabled}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AiAgentPage() {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <LoggedOutPrompt />;
  if (!isAiAgentEnabled()) return <MockAiAgentPage />;
  return <RealAiAgentPage key={aiSessionKey(user) ?? "ai-session-pending"} />;
}

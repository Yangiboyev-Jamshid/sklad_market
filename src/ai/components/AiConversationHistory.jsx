import { useEffect, useState } from "react";
import { Add, ArrowDown2 } from "iconsax-reactjs";
import { listConversations } from "../api/aiClient";
import { t, useAiLocale } from "../i18n";

const HISTORY_SESSION_LIMIT = 15;

function conversationItems(response) {
  const items = Array.isArray(response) ? response : response?.items;
  return (Array.isArray(items) ? items : []).slice(0, HISTORY_SESSION_LIMIT);
}

function formatUpdatedAt(value, locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AiConversationHistory({
  accountKey,
  activeConversationId,
  chatStatus,
  disabled = false,
  onNewChat,
  onSelect,
}) {
  const locale = useAiLocale();
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!accountKey || (chatStatus !== "idle" && chatStatus !== "error")) return undefined;
    const controller = new AbortController();
    listConversations({
      page: 1,
      per_page: HISTORY_SESSION_LIMIT,
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;
        setSessions(conversationItems(response));
        setStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.code === "ERR_CANCELED") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [accountKey, activeConversationId, chatStatus, retryToken]);

  const startNewChat = () => {
    if (disabled) return;
    setMobileOpen(false);
    onNewChat?.();
  };

  const selectConversation = (conversationId) => {
    if (disabled || !conversationId || conversationId === activeConversationId) return;
    setMobileOpen(false);
    onSelect?.(conversationId);
  };

  return (
    <aside className="self-start overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-[#1C1C1C] dark:bg-[#0D0D0D] lg:flex lg:h-full lg:min-h-0 lg:w-full lg:self-stretch lg:flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 p-3 dark:border-[#1C1C1C]">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-ink-900 dark:text-white">
            {t("history.title")}
          </h2>
          <p className="text-[10px] text-ink-400">{t("history.limitNote")}</p>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Add size={15} />
          {t("history.newChat")}
        </button>
      </div>

      <button
        type="button"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-ink-600 lg:hidden dark:text-ink-300"
      >
        {mobileOpen ? t("history.hide") : t("history.show")}
        <ArrowDown2
          size={14}
          className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div className={`${mobileOpen ? "flex" : "hidden"} min-h-0 flex-1 flex-col lg:flex`}>
        {status === "loading" && (
          <div role="status" className="space-y-2 p-3" aria-label={t("history.loading")}>
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-ink-50 dark:bg-[#171717]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="p-3 text-center">
            <p className="text-xs text-ink-500 dark:text-ink-400">{t("history.error")}</p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setRetryToken((token) => token + 1);
              }}
              className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {status === "ready" && sessions.length === 0 && (
          <p className="p-4 text-center text-xs leading-relaxed text-ink-400">
            {t("history.empty")}
          </p>
        )}

        {status === "ready" && sessions.length > 0 && (
          <div
            role="list"
            aria-label={t("history.title")}
            className="max-h-48 space-y-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable] lg:min-h-0 lg:max-h-none lg:flex-1"
          >
            {sessions.map((session) => {
              const conversationId = String(session?.id ?? "");
              if (!conversationId) return null;
              const selected = conversationId === activeConversationId;
              const title = String(session.title || "").trim() || t("history.untitled");
              const updatedAt = formatUpdatedAt(session.updatedAt ?? session.createdAt, locale);
              return (
                <div role="listitem" key={conversationId}>
                  <button
                    type="button"
                    aria-label={title}
                    aria-current={selected ? "true" : undefined}
                    disabled={disabled && !selected}
                    onClick={() => selectConversation(conversationId)}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200"
                        : "text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-[#171717]"
                    }`}
                  >
                    <span className="block truncate text-xs font-semibold">
                      {title}
                    </span>
                    {updatedAt && (
                      <time
                        dateTime={session.updatedAt ?? session.createdAt}
                        className="mt-1 block text-[10px] font-normal text-ink-400"
                      >
                        {updatedAt}
                      </time>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

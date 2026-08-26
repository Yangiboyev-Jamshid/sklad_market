import { useEffect, useState } from "react";
import { SearchNormal1 } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { searchBusinesses } from "../api/aiClient";
import { isAiAgentEnabled } from "../flag";
import { t as aiT } from "../i18n";
import AiAgentLogo from "./AiAgentLogo";

const FILTERS = ["ALL", "PRODUCT", "COMPANY"];

function asText(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function resultPath(item) {
  const type = asText(item.type).toUpperCase();
  const slug = asText(item.slug);
  if (!slug || (type !== "PRODUCT" && type !== "COMPANY")) return null;
  return `${type === "PRODUCT" ? "/product/" : "/company/"}${encodeURIComponent(slug)}`;
}

function formatScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function localizedReason(reason) {
  const normalized = asText(reason).toUpperCase();
  if (!normalized) return "";
  const key = `results.reason.${normalized}`;
  const translated = aiT(key);
  return translated === key ? normalized.replaceAll("_", " ").toLowerCase() : translated;
}

function ResultRow({ item, locale, t }) {
  const type = asText(item.type).toUpperCase();
  const path = resultPath(item);
  const score = formatScore(item.relevance);
  const reasons = Array.isArray(item.reasons) ? item.reasons.slice(0, 2) : [];
  const price = Number(item.price);
  const priceLabel = Number.isFinite(price)
    ? `${new Intl.NumberFormat(locale).format(price)} ${asText(item.currency)}`.trim()
    : null;
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {t(`home.aiAssistant.panel.type.${type}`)}
          </span>
          <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {asText(item.name) || t("home.aiAssistant.panel.unnamed")}
          </h4>
        </div>
        {score !== null && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {score}%
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
        {priceLabel && <span>{priceLabel}</span>}
        {Number.isFinite(Number(item.productCount)) && (
          <span>{t("home.aiAssistant.panel.productCount", { count: Number(item.productCount) })}</span>
        )}
        {asText(item.verificationStatus).toUpperCase() === "VERIFIED" && (
          <span className="text-success-600 dark:text-success-400">
            {t("home.aiAssistant.panel.verified")}
          </span>
        )}
      </div>

      {reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-md bg-ink-50 px-1.5 py-1 text-[10px] text-ink-500 dark:bg-[#1A1A1A] dark:text-ink-400"
            >
              {localizedReason(reason)}
            </span>
          ))}
        </div>
      )}
    </>
  );

  if (!path) {
    return <div className="rounded-xl border border-ink-100 p-3 dark:border-[#242424]">{content}</div>;
  }
  return (
    <Link
      to={path}
      aria-label={asText(item.name) || t("home.aiAssistant.panel.openResult")}
      className="group block rounded-xl border border-ink-100 bg-white p-3 outline-none transition-all hover:border-brand-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-[#242424] dark:bg-[#111111] dark:hover:border-brand-500/30"
    >
      {content}
    </Link>
  );
}

export default function DashboardAiSearchPanel({ query, isLoggedIn }) {
  const { t, i18n } = useTranslation();
  const cleanQuery = String(query ?? "").trim().slice(0, 300);
  const enabled = isAiAgentEnabled() && isLoggedIn && cleanQuery.length >= 2;
  const [state, setState] = useState({
    query: null,
    status: "idle",
    items: [],
    freshness: null,
    errorStatus: null,
    errorCode: null,
  });
  const [filter, setFilter] = useState("ALL");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({
        query: cleanQuery,
        status: "loading",
        items: [],
        freshness: null,
        errorStatus: null,
        errorCode: null,
      });
      searchBusinesses(
        { query: cleanQuery, types: ["PRODUCT", "COMPANY"], limit: 8 },
        { signal: controller.signal }
      )
        .then((response) => {
          if (controller.signal.aborted) return;
          setState({
            query: cleanQuery,
            status: "success",
            items: Array.isArray(response?.items) ? response.items.slice(0, 8) : [],
            freshness: response?.indexFreshness ?? null,
            errorStatus: null,
            errorCode: null,
          });
        })
        .catch((error) => {
          if (controller.signal.aborted || error?.code === "ERR_CANCELED") return;
          setState({
            query: cleanQuery,
            status: "error",
            items: [],
            freshness: null,
            errorStatus: error?.status ?? null,
            errorCode: error?.aiCode ?? null,
          });
        });
    }, 650);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cleanQuery, enabled, retryToken]);

  if (!enabled) return null;

  const visibleState = state.query === cleanQuery
    ? state
    : { status: "loading", items: [], freshness: null, errorStatus: null, errorCode: null };
  const filteredItems = visibleState.items.filter(
    (item) => filter === "ALL" || asText(item.type).toUpperCase() === filter
  );

  const locale = i18n.resolvedLanguage || i18n.language || "ru";
  const errorKey = visibleState.errorCode === "budget_exceeded"
    ? "home.aiAssistant.panel.budgetExceeded"
    : visibleState.errorStatus === 429
      ? "home.aiAssistant.panel.rateLimited"
      : "home.aiAssistant.panel.error";

  return (
    <aside
      aria-label={t("home.aiAssistant.panel.title")}
      className="relative z-0 order-last w-full min-w-0 max-w-full self-start overflow-hidden rounded-2xl border border-brand-200/80 bg-white shadow-card dark:border-brand-500/20 dark:bg-[#0D0D0D] xl:sticky xl:top-4"
    >
      <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-500/15 dark:from-[#10172A] dark:to-[#0D0D0D]">
        <div className="flex items-start gap-3">
          <AiAgentLogo size={36} className="shadow-sm" />
          <div className="min-w-0">
            <h3 className="font-display text-sm font-bold text-ink-900 dark:text-white">
              {t("home.aiAssistant.panel.title")}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              {t("home.aiAssistant.panel.subtitle", { query: cleanQuery })}
            </p>
          </div>
        </div>

        <div className="mt-3 flex rounded-xl bg-white/80 p-1 dark:bg-black/20" role="group" aria-label={t("home.aiAssistant.panel.filterLabel")}>
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                filter === value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
              }`}
            >
              {t(`home.aiAssistant.panel.filter.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {visibleState.status === "loading" && (
          <div role="status" aria-label={t("home.aiAssistant.panel.loading")} className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-ink-50 dark:bg-[#171717]" />
            ))}
          </div>
        )}

        {visibleState.status === "error" && (
          <div role="alert" className="rounded-xl border border-warning-400/25 bg-warning-50 p-3 text-center dark:border-warning-500/20 dark:bg-warning-500/10">
            <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">{t(errorKey)}</p>
            <button
              type="button"
              onClick={() => setRetryToken((value) => value + 1)}
              className="mt-2 rounded-lg border border-warning-400/30 px-3 py-1.5 text-xs font-semibold text-warning-600 hover:bg-white/60 dark:text-warning-400 dark:hover:bg-white/5"
            >
              {t("home.aiAssistant.panel.retry")}
            </button>
          </div>
        )}

        {visibleState.status === "success" && filteredItems.length === 0 && (
          <div role="status" className="rounded-xl bg-ink-50 p-4 text-center dark:bg-[#171717]">
            <SearchNormal1 size={22} className="mx-auto text-ink-300 dark:text-ink-600" />
            <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
              {filter === "ALL" ? t("home.aiAssistant.panel.empty") : t("home.aiAssistant.panel.emptyFilter")}
            </p>
          </div>
        )}

        {visibleState.status === "success" && filteredItems.length > 0 && (
          <div role="list" className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {filteredItems.map((item, index) => (
              <div role="listitem" key={`${item.type}-${item.id ?? item.slug}-${index}`}>
                <ResultRow item={item} locale={locale} t={t} />
              </div>
            ))}
          </div>
        )}

        {visibleState.freshness?.stale && (
          <p className="mt-3 text-[10px] leading-relaxed text-warning-600 dark:text-warning-400">
            {t("home.aiAssistant.panel.stale")}
          </p>
        )}

      </div>
    </aside>
  );
}

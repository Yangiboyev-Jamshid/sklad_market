import { useState } from "react";
import { t } from "../i18n";

// Renders the suggest-listing REST response (PLAN.md Phase 6, C8): a proposed category +
// per-field attribute values, each STRICTLY validated server-side against the real category
// schema. Suggest-only — copy-to-clipboard per field, no auto-fill of the team's own
// add-product form (out of scope per PLAN.md §4.1: we don't touch that component).
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently do nothing rather than crash the card
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors shrink-0"
    >
      {copied ? t("seller.copied") : t("seller.copy")}
    </button>
  );
}

export default function SuggestedListingCard({ result }) {
  if (!result) return null;
  const { category, categoryConfidence, attributes = [], missingRequired = [], notes } = result;

  return (
    <div className="rounded-xl border border-ink-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] px-4 py-3.5 text-sm">
      {category ? (
        <>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-400">{t("seller.resultCategory")}</div>
              <div className="font-semibold text-ink-900 dark:text-white">{category.name}</div>
            </div>
            <CopyButton value={category.name} />
          </div>
          {categoryConfidence != null && (
            <div className="text-xs text-ink-500 dark:text-ink-400 mb-3">
              {t("seller.resultConfidence", { percent: Math.round(categoryConfidence * 100) })}
            </div>
          )}

          {attributes.length > 0 ? (
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-400 mb-1.5">{t("seller.resultAttributes")}</div>
              <ul className="flex flex-col gap-1.5">
                {attributes.map((attr) => (
                  <li
                    key={attr.code}
                    className="flex items-center justify-between gap-3 bg-ink-50 dark:bg-[#171717] rounded-lg px-3 py-2"
                  >
                    <span className="text-ink-700 dark:text-ink-200 truncate">
                      <span className="text-ink-400">{attr.label}: </span>
                      {String(attr.value)}
                    </span>
                    <CopyButton value={attr.value} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-xs text-ink-500 dark:text-ink-400 mb-3">{t("seller.resultEmptyAttributes")}</div>
          )}

          {missingRequired.length > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">
              {t("seller.resultMissingRequired")}: {missingRequired.join(", ")}
            </div>
          )}
        </>
      ) : (
        <div className="text-ink-600 dark:text-ink-300">{t("seller.resultEmptyCategory")}</div>
      )}

      {notes && (
        <div className="text-xs text-ink-500 dark:text-ink-400 mt-2">
          {t("seller.resultNotes")}: {notes}
        </div>
      )}
    </div>
  );
}

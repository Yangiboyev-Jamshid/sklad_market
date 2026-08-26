import { motion } from "framer-motion";
import { t } from "../i18n";

// `role` (raw platform role string, e.g. "SELLER"/"ADMIN"/"SUPER_ADMIN") adds a couple of
// persona-relevant suggestion chips on top of the base set (PLAN.md Phase 6) — purely a UX nudge
// toward tools the backend already gates by role; it grants no capability by itself.
export default function Suggestions({ onSelect, role, disabled = false }) {
  const items = [
    ...t("suggestions.items"),
    ...(role === "SELLER" ? t("suggestions.sellerItems") : []),
    ...(role === "ADMIN" || role === "SUPER_ADMIN" ? t("suggestions.adminItems") : []),
  ];

  return (
    <div className="grid sm:grid-cols-2 grid-cols-1 justify-center gap-3 sm:gap-3">
      {items.map((s, i) => (
        <motion.button
          key={i}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 sm:px-4 py-5 sm:py-3 text-xs sm:text-sm text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-50"
        >
          {s}
        </motion.button>
      ))}
    </div>
  );
}

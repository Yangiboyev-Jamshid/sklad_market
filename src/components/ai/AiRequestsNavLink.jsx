import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Setting2 } from "iconsax-reactjs";

function isAdmin(role) {
  const normalized = String(role ?? "").toUpperCase();
  return normalized.includes("SUPER_ADMIN") || normalized.includes("ADMIN");
}

export default function AiRequestsNavLink({ role }) {
  const { t } = useTranslation();

  if (!isAdmin(role)) return null;

  return (
    <Link
      to="/moderator?tab=ai-requests"
      className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 dark:border-[#1C1C1C] dark:bg-[#0D0D0D] dark:text-ink-200 dark:hover:border-brand-500 dark:hover:text-brand-300"
    >
      <Setting2 size={16} />
      {t("ai.rateLimits.title")}
    </Link>
  );
}

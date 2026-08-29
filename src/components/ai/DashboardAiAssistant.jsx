import { motion } from "framer-motion";
import { ArrowRight2, CloseCircle } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "react-router-dom";
import AiAgentLogo from "./AiAgentLogo";

const ONBOARDING_VERSION = "v1";

function preferredName(user) {
  const value = user?.firstName || user?.name || user?.username;
  return String(value || "").trim().split(/\s+/)[0];
}

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function onboardingKey(user) {
  const identity = user?.username || (user?.id != null ? `id-${user.id}` : null);
  if (!identity) return null;
  return `skladx_ai_onboarding_${ONBOARDING_VERSION}:${identity}:${normalizeRole(user?.role) || "USER"}`;
}

function hasSeenOnboarding(key) {
  if (!key) return true;
  try {
    return window.localStorage.getItem(key) === "seen";
  } catch {
    return false;
  }
}

export default function DashboardAiAssistant({ user, isLoggedIn }) {
  const { t } = useTranslation();
  const key = onboardingKey(user);
  const [dismissedKey, setDismissedKey] = useState(null);
  const showOnboarding = Boolean(key && dismissedKey !== key && !hasSeenOnboarding(key));

  if (!isLoggedIn || !showOnboarding) return null;

  const role = normalizeRole(user?.role);
  const instructions = t("home.aiAssistant.instructions", { returnObjects: true });
  const roleGuideKey = role === "SELLER"
    ? "home.aiAssistant.sellerGuide"
    : role === "BUYER"
      ? "home.aiAssistant.buyerGuide"
      : "home.aiAssistant.generalGuide";

  const markOnboardingSeen = () => {
    if (key) {
      try {
        window.localStorage.setItem(key, "seen");
      } catch {
        // Storage can be unavailable in private/restricted browser modes; the guide still works.
      }
    }
    setDismissedKey(key);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label={t("home.aiAssistant.badge")}
      className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-br from-white via-brand-50/70 to-[#EEF3FF] p-4 shadow-card dark:border-brand-500/20 dark:from-[#0D0D0D] dark:via-[#10172A] dark:to-[#111827] sm:p-5"
    >
      <button
        type="button"
        onClick={markOnboardingSeen}
        aria-label={t("home.aiAssistant.dismiss")}
        title={t("home.aiAssistant.dismiss")}
        className="absolute right-1 top-1 z-10 rounded-full p-1 text-ink-400 transition-colors hover:bg-white/70 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <CloseCircle size={20} variant="Linear" />
      </button>
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-300/20 blur-3xl dark:bg-brand-500/10" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.72fr)] lg:items-center">
        <div className="min-w-0 pr-8">
          <div className="mb-2 flex items-center gap-2">
            <AiAgentLogo size={36} className="shadow-sm" />
            <span className="rounded-full border border-brand-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:border-brand-500/25 dark:bg-white/5 dark:text-brand-300">
              {t("home.aiAssistant.badge")}
            </span>
          </div>
          <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white sm:text-xl">
            {preferredName(user)
              ? t("home.aiAssistant.greeting", { name: preferredName(user) })
              : t("home.aiAssistant.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">
            {t("home.aiAssistant.subtitle")}
          </p>
          <div className="mt-4 rounded-xl border border-brand-200/80 bg-white/80 p-3 dark:border-brand-500/20 dark:bg-white/5">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              {t("home.aiAssistant.firstTimeTitle")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              {t(roleGuideKey)}
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-brand-100 bg-white/65 p-3 dark:border-brand-500/15 dark:bg-white/[0.035]">
          <p className="mb-2 text-xs font-bold text-ink-800 dark:text-ink-100">
            {t("home.aiAssistant.howToTitle")}
          </p>
          <ol className="space-y-2">
            {(Array.isArray(instructions) ? instructions : []).map((instruction, index) => (
              <li key={instruction} className="flex gap-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
          <Link
            to="/ai-agent"
            onClick={markOnboardingSeen}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]"
          >
            {t("home.aiAssistant.open")}
            <ArrowRight2 size={14} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

import { motion, AnimatePresence } from "framer-motion";
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

function ChatIllustration() {
  return (
    <svg viewBox="0 0 260 200" className="h-full w-full" aria-hidden="true">
      <rect x="14" y="10" width="180" height="152" rx="20" className="fill-brand-50 dark:fill-white/[0.04]" />
      <rect x="14" y="10" width="180" height="152" rx="20" fill="none" strokeWidth="2" className="stroke-brand-100 dark:stroke-white/10" />

      <rect x="32" y="34" width="118" height="16" rx="8" className="fill-white dark:fill-white/10" />
      <rect x="32" y="58" width="86" height="16" rx="8" className="fill-white dark:fill-white/10" />

      <rect x="66" y="90" width="110" height="16" rx="8" className="fill-brand-600" />

      <circle cx="36" cy="124" r="4" className="fill-brand-200 dark:fill-white/20" />
      <circle cx="49" cy="124" r="4" className="fill-brand-200 dark:fill-white/20" />
      <circle cx="62" cy="124" r="4" className="fill-brand-200 dark:fill-white/20" />

      <rect x="152" y="122" width="94" height="62" rx="14" className="fill-brand-900/10 dark:fill-black/30" />
      <rect x="146" y="114" width="94" height="62" rx="14" strokeWidth="2" className="fill-white stroke-ink-200 dark:fill-[#0D0D0D] dark:stroke-white/10" />
      <rect x="158" y="126" width="24" height="24" rx="6" className="fill-brand-100 dark:fill-brand-500/20" />
      <rect x="190" y="130" width="38" height="8" rx="4" className="fill-ink-800 dark:fill-white/70" />
      <rect x="190" y="142" width="26" height="7" rx="3.5" className="fill-ink-300 dark:fill-white/30" />
      <rect x="158" y="160" width="56" height="7" rx="3.5" className="fill-brand-400" />
    </svg>
  );
}

export default function DashboardAiAssistant({ user, isLoggedIn }) {
  const { t } = useTranslation();
  const key = onboardingKey(user);
  const [dismissedKey, setDismissedKey] = useState(null);
  const showOnboarding = Boolean(key && dismissedKey !== key && !hasSeenOnboarding(key));
  const visible = isLoggedIn && showOnboarding;

  const role = normalizeRole(user?.role);
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
        
      }
    }
    setDismissedKey(key);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="ai-assistant-banner"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          aria-label={t("home.aiAssistant.badge")}
          className="relative mb-6 overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-[#1C1C1C] dark:bg-[#0D0D0D] sm:mb-8 sm:p-6"
        >
          <button
            type="button"
            onClick={markOnboardingSeen}
            aria-label={t("home.aiAssistant.dismiss")}
            title={t("home.aiAssistant.dismiss")}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <CloseCircle size={20} variant="Linear" />
          </button>

          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                  <AiAgentLogo size={24} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  {t("home.aiAssistant.badge")}
                </span>
              </div>

              <h2 className="mt-4 max-w-lg font-display text-2xl font-extrabold leading-tight tracking-tight text-ink-900 dark:text-white sm:text-[1.75rem]">
                {preferredName(user)
                  ? t("home.aiAssistant.greeting", { name: preferredName(user) })
                  : t("home.aiAssistant.title")}
              </h2>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                {t("home.aiAssistant.subtitle")}
              </p>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-ink-400 dark:text-ink-500">
                {t(roleGuideKey)}
              </p>

              <Link
                to="/ai-agent"
                onClick={markOnboardingSeen}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0"
              >
                {t("home.aiAssistant.open")}
                <ArrowRight2 size={15} />
              </Link>
            </div>

            <div className="hidden sm:block">
              <ChatIllustration />
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

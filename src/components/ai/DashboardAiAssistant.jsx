import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight2, CloseCircle } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "react-router-dom";
import AiAgentLogo from "./AiAgentLogo";
import { onboardingKey, hasSeenOnboarding } from "../../utils/aiOnboarding";

function preferredName(user) {
  const value = user?.firstName || user?.name || user?.username;
  return String(value || "").trim().split(/\s+/)[0];
}

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function ChatIllustration({ className }) {
  return (
    <svg viewBox="0 0 260 200" className={className} aria-hidden="true">
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

export default function DashboardAiAssistant({ user, isLoggedIn, onDismiss, compact = false }) {
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
    onDismiss?.();
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
          className={`relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-[#1C1C1C] dark:bg-[#0D0D0D] ${compact ? "flex h-44 flex-col justify-center p-4 sm:h-[18rem]" : "p-5 sm:p-6"
            }`}
        >
          {compact && (
            <ChatIllustration className="pointer-events-none absolute -right-6 top-1/2 block h-[125%] w-auto -translate-y-1/2 opacity-[0.14] sm:h-[140%]" />
          )}

          <button
            type="button"
            onClick={markOnboardingSeen}
            aria-label={t("home.aiAssistant.dismiss")}
            title={t("home.aiAssistant.dismiss")}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <CloseCircle size={compact ? 16 : 20} variant="Linear" />
          </button>

          <div className="relative z-10 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10 ${compact ? "h-8 w-8" : "h-11 w-11"}`}>
                <AiAgentLogo size={compact ? 18 : 24} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                {t("home.aiAssistant.badge")}
              </span>
            </div>

            <h2 className={`mt-3 max-w-lg font-display font-extrabold leading-tight tracking-tight text-ink-900 dark:text-white ${compact ? "text-lg" : "text-2xl sm:text-[1.75rem]"
              }`}>
              {preferredName(user)
                ? t("home.aiAssistant.greeting", { name: preferredName(user) })
                : t("home.aiAssistant.title")}
            </h2>
            <p className={`mt-2 max-w-lg leading-relaxed text-ink-500 dark:text-ink-400 ${compact ? "text-xs line-clamp-2" : "text-sm"}`}>
              {t("home.aiAssistant.subtitle")}
            </p>
            {!compact && (
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-ink-400 dark:text-ink-500">
                {t(roleGuideKey)}
              </p>
            )}

            <Link
              to="/ai-agent"
              onClick={markOnboardingSeen}
              className={`inline-flex items-center gap-2 rounded-full bg-brand-600 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0 ${compact ? "mt-3 px-4 py-2 text-xs" : "mt-5 px-5 py-2.5 text-sm"
                }`}
            >
              {t("home.aiAssistant.open")}
              <ArrowRight2 size={compact ? 13 : 15} />
            </Link>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight2, SearchNormal1 } from "iconsax-reactjs";
import { IoIosClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AiAgentLogo from "./AiAgentLogo";
import { onboardingKey, hasSeenOnboarding } from "../../utils/aiOnboarding";

function preferredName(user) {
  const value = user?.firstName || user?.name || user?.username;
  return String(value || "").trim().split(/\s+/)[0];
}

export default function DashboardAiAssistant({ user, isLoggedIn, onDismiss }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const key = onboardingKey(user);
  const [dismissedKey, setDismissedKey] = useState(null);
  const [query, setQuery] = useState("");
  const showOnboarding = Boolean(key && dismissedKey !== key && !hasSeenOnboarding(key));
  const visible = isLoggedIn && showOnboarding;

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    navigate("/ai-agent", {
      state: trimmedQuery ? { initialMessage: trimmedQuery } : undefined,
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="ai-assistant-banner"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          aria-label={t("home.aiAssistant.badge")}
          className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-[#0D0D0D] border border-ink-100 dark:border-[#1C1C1C] shadow-card transition-colors h-16 sm:h-[4.5rem]"
        >
          <div className="relative z-10 flex h-full items-center gap-2.5 pl-3.5 pr-12 sm:gap-3.5 sm:pl-5 sm:pr-16">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 sm:h-10 sm:w-10">
              <AiAgentLogo size={20} className="shrink-0" />
            </span>

            <div className="hidden shrink-0 sm:block">
              <p className="font-display text-sm font-bold leading-tight text-ink-900 dark:text-white">
                {preferredName(user)
                  ? t("home.aiAssistant.greeting", { name: preferredName(user) })
                  : t("home.aiAssistant.title")}
              </p>
              <p className="text-[11px] leading-tight text-ink-400 dark:text-ink-500">{t("home.aiAssistant.searchPrompt")}</p>
            </div>

            <div className="hidden h-8 w-px shrink-0 bg-ink-100 dark:bg-[#1C1C1C] sm:block" />

            <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-ink-50 dark:bg-[#171717] px-3.5 py-2 ring-1 ring-transparent transition-colors focus-within:ring-brand-300 dark:focus-within:ring-brand-500/40 sm:py-2.5">
              <SearchNormal1 size={16} className="shrink-0 text-ink-400 dark:text-ink-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("home.aiAssistant.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 dark:text-white outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500"
              />
              <button
                type="submit"
                aria-label={t("home.aiAssistant.open")}
                className="flex shrink-0 items-center justify-center rounded-full bg-brand-600 hover:bg-brand-700 p-1.5 text-white transition-transform hover:scale-105 active:scale-95 sm:p-2"
              >
                <ArrowRight2 size={14} className="sm:hidden" />
                <ArrowRight2 size={15} className="hidden sm:block" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={markOnboardingSeen}
            aria-label={t("home.aiAssistant.dismiss")}
            title={t("home.aiAssistant.dismiss")}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <IoIosClose size={20} />
          </button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

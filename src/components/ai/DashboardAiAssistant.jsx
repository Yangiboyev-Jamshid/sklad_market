import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight2, SearchNormal1, Judge, Star1 } from "iconsax-reactjs";
import { IoIosClose } from "react-icons/io";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AiAgentLogo from "./AiAgentLogo";
import { onboardingKey, hasSeenOnboarding } from "../../utils/aiOnboarding";

function preferredName(user) {
  const value = user?.firstName || user?.name || user?.username;
  return String(value || "").trim().split(/\s+/)[0];
}

const QUICK_ACTIONS = [
  { icon: SearchNormal1, titleKey: "home.aiAssistant.findAction", descKey: "home.aiAssistant.findActionDesc" },
  { icon: Judge, titleKey: "home.aiAssistant.compareAction", descKey: "home.aiAssistant.compareActionDesc" },
  { icon: Star1, titleKey: "home.aiAssistant.recommendAction", descKey: "home.aiAssistant.recommendActionDesc" },
];

const STAR_DOTS = [
  { top: "18%", left: "58%", size: 3, opacity: 0.8 },
  { top: "32%", left: "78%", size: 2, opacity: 0.6 },
  { top: "58%", left: "70%", size: 2, opacity: 0.5 },
  { top: "72%", left: "50%", size: 2, opacity: 0.7 },
  { top: "22%", left: "20%", size: 2, opacity: 0.4 },
];

export default function DashboardAiAssistant({ user, isLoggedIn, onDismiss, compact = false }) {
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
    markOnboardingSeen();
    navigate("/ai-agent");
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
          className={`relative overflow-hidden rounded-2xl shadow-card ring-1 ring-black/5 dark:ring-white/10 ${compact ? "h-54 sm:h-[18rem]" : ""}`}
        >
          <button
            type="button"
            onClick={markOnboardingSeen}
            aria-label={t("home.aiAssistant.dismiss")}
            title={t("home.aiAssistant.dismiss")}
            className="absolute right-2 top-2 z-20 rounded-full p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:text-ink-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <IoIosClose size={compact ? 20 : 24} />
          </button>

          <div className="relative grid h-full grid-cols-[40%_60%] sm:grid-cols-[40%_60%] bg-gradient-to-br from-[#0A1A3C] via-[#0E2455] to-[#153A82]">
            <div className={`relative flex h-full flex-col items-start justify-center overflow-hidden ${compact ? "px-3 py-3 sm:px-6 sm:py-6" : "px-5 py-6 sm:px-8 sm:py-8"}`}>
              <div
                className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl"
                style={{ width: "70%", aspectRatio: "1 / 1" }}
              />

              <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
                <path d="M55,-10 C75,20 70,80 55,110" stroke="#7dd3fc" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
              </svg>

              {STAR_DOTS.map((dot, i) => (
                <span
                  key={i}
                  className="pointer-events-none absolute rounded-full bg-white"
                  style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size, opacity: dot.opacity }}
                />
              ))}

              <svg className="pointer-events-none absolute bottom-4 left-4 h-3 w-3 text-white/50 sm:bottom-6 sm:left-6" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              <div className="relative z-10 flex items-center gap-2">
                <AiAgentLogo size={compact ? 18 : 24} className="shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300 sm:text-xs">
                  {t("home.aiAssistant.badge")}
                </span>
              </div>

              <h2 className={`relative z-10 font-display font-extrabold leading-tight text-white ${compact ? "mt-2 max-w-[9.5rem] text-sm sm:mt-4 sm:max-w-[11rem] sm:text-lg" : "mt-5 max-w-[16rem] text-2xl"}`}>
                {t("home.aiAssistant.tagline")}
              </h2>
              <p className={`relative z-10 leading-relaxed text-white/60 ${compact ? "mt-1.5 hidden max-w-[10rem] text-[11px] sm:block" : "mt-3 max-w-[15rem] text-sm"}`}>
                {t("home.aiAssistant.taglineDesc")}
              </p>
            </div>
            <div className="absolute -top-10 -bottom-10 left-[35%] right-0 rounded-l-[90%] bg-white dark:bg-[#0D0D0D]" />
            <div className={`relative z-10 flex flex-col justify-center ${compact ? "px-4 py-4" : "px-4 py-4 sm:px-8 sm:py-6"}`}>
              <h2 className={`font-display font-extrabold leading-tight text-ink-900 dark:text-white ${compact ? "text-base" : "text-xl sm:text-2xl"}`}>
                {preferredName(user)
                  ? t("home.aiAssistant.greeting", { name: preferredName(user) })
                  : t("home.aiAssistant.title")}
              </h2>
              <p className={`mt-1 text-ink-400 dark:text-ink-500 ${compact ? "text-xs" : "text-sm"}`}>
                {t("home.aiAssistant.searchPrompt")}
              </p>

              <form onSubmit={handleSearchSubmit} className="mt-3 flex items-center gap-2 rounded-full bg-ink-50 py-1.5 pl-4 pr-1.5 ring-1 ring-transparent transition-shadow focus-within:ring-brand-300 dark:bg-white/5 dark:focus-within:ring-brand-500/40">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("home.aiAssistant.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-white dark:placeholder:text-ink-500"
                />
                <button
                  type="submit"
                  aria-label={t("home.aiAssistant.open")}
                  className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sky-400 p-2.5 text-white transition-transform hover:scale-105 active:scale-95"
                >
                  <ArrowRight2 size={16} />
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {QUICK_ACTIONS.map(({ icon: Icon, titleKey, descKey }) => (
                  <Link
                    key={titleKey}
                    to="/ai-agent"
                    onClick={markOnboardingSeen}
                    className={`flex items-center gap-2 rounded-xl border border-ink-100 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 ${compact ? "p-1.5" : "p-2"}`}
                  >
                    <span className={`flex shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
                      <Icon size={compact ? 13 : 16} />
                    </span>
                  </Link>
                ))}

                <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-success-600 dark:text-success-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500" />
                  </span>
                  <span className="hidden sm:inline">{t("home.aiAssistant.readyStatus")}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

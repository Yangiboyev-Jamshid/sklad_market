import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown2, Global } from "iconsax-reactjs";
import { AnimatePresence, motion } from "framer-motion";

const LANGUAGES = [
  { code: "uz", label: "UZ", name: "O'zbekcha" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "en", label: "EN", name: "English" },
];

export default function LanguageSwitcher({ variant = "header", alwaysVisible = false }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[1];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-[#171717] hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
        >
          <Global size={20} variant="Linear" />
          <span className="flex-1 text-left">{t("header.language")}</span>
          <span className="text-xs text-ink-400 dark:text-ink-500">{current.label}</span>
          <ArrowDown2 size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 py-1 pl-11 pr-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => selectLang(l.code)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${l.code === i18n.language
                      ? "text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-500/10"
                      : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-[#171717]"
                      }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`relative ${alwaysVisible ? "block" : "hidden sm:block"}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-full bg-ink-100 dark:bg-[#1C1C1C] text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-[#1E1E1E] transition-colors text-xs sm:text-sm font-semibold shrink-0"
        aria-label={t("header.language")}
      >
        {current.label}
        <ArrowDown2 size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-40 bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] p-2 z-50"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => selectLang(l.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${l.code === i18n.language
                  ? "text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-500/15"
                  : "text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-[#171717]"
                  }`}
              >
                <span>{l.name}</span>
                <span className="text-xs text-ink-400">{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

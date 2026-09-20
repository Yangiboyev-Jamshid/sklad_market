import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MessageQuestion } from "iconsax-reactjs";
import { IoIosClose } from "react-icons/io";
import { hasSeenHint, markHintSeen } from "../../utils/helpHints";

export default function HelpHint({
  id,
  title,
  purpose,
  steps,
  requiredData,
  pitfalls,
  detailsHref,
  autoShow = true,
  align = "left",
  className = "",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => autoShow && !hasSeenHint(id));
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    markHintSeen(id);
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
    }
  };

  return (
    <div className={`relative inline-flex ${className}`} ref={boxRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t("helpHint.open")}
        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-brand-600 dark:text-ink-500 dark:hover:bg-white/5 dark:hover:text-brand-400"
      >
        <MessageQuestion size={16} variant="Bold" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full z-30 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-popover dark:border-[#1C1C1C] dark:bg-[#171717] ${align === "right" ? "right-0" : "left-0"
              }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
              <button
                type="button"
                onClick={close}
                aria-label={t("helpHint.close")}
                className="shrink-0 rounded-full p-0.5 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <IoIosClose size={18} />
              </button>
            </div>

            {purpose && <p className="mb-2.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{purpose}</p>}

            {steps?.length > 0 && (
              <div className="mb-2.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                  {t("helpHint.howToUse")}
                </p>
                <ol className="flex flex-col gap-1 text-xs text-ink-600 dark:text-ink-300">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="shrink-0 text-ink-400 dark:text-ink-500">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {requiredData?.length > 0 && (
              <div className="mb-2.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                  {t("helpHint.requiredData")}
                </p>
                <ul className="flex flex-col gap-1 text-xs text-ink-600 dark:text-ink-300">
                  {requiredData.map((item, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="shrink-0 text-brand-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pitfalls?.length > 0 && (
              <div className="mb-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warning-600 dark:text-warning-400">
                  {t("helpHint.pitfalls")}
                </p>
                <ul className="flex flex-col gap-1 text-xs text-ink-600 dark:text-ink-300">
                  {pitfalls.map((item, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="shrink-0 text-warning-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detailsHref && (
              <a
                href={detailsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {t("helpHint.moreDetails")}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

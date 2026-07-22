import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageQuestion, CloseCircle, Call } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { CONTACT_PHONE } from "../../config/contact";

export default function SupportChatWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const roleUpper = (user?.role || "").toUpperCase();
  const isModerator = roleUpper.includes("MODERATOR") || roleUpper.includes("ADMIN");
  if (isModerator) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-popover flex items-center justify-center transition-colors"
        aria-label={t("chat.supportButtonLabel")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            {open ? <CloseCircle size={26} variant="Linear" /> : <MessageQuestion size={26} variant="Bold" />}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-[92px] right-5 sm:bottom-[104px] sm:right-6 z-40 w-[calc(100vw-2.5rem)] max-w-sm bg-[#FAFAFA] dark:bg-[#121212] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D]">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <MessageQuestion size={16} variant="Bold" />
                </span>
                <span className="font-semibold text-sm text-ink-900 dark:text-white">{t("chat.supportTitle")}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors"
                aria-label={t("common.close")}
              >
                <CloseCircle size={20} variant="Linear" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center gap-3 px-6 py-8">
              <p className="font-semibold text-ink-900 dark:text-white">{t("chat.temporarilyUnavailable")}</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">{t("chat.temporarilyUnavailableDesc")}</p>
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                className="group flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors text-sm font-semibold"
              >
                <Call size={16} variant="Linear" />
                {CONTACT_PHONE}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

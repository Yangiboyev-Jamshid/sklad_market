import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { IoIosClose } from "react-icons/io";

export default function PromoInterstitial({ campaign, onClose }) {
  return (
    <AnimatePresence>
      {campaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-popover dark:bg-[#0D0D0D] sm:max-w-md"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <IoIosClose size={22} />
            </button>

            {campaign.imageUrl && (
              <div className="h-40 w-full bg-ink-100 dark:bg-[#1C1C1C] sm:h-48">
                <img src={campaign.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="p-5 sm:p-6">
              <p className="mb-1.5 font-display text-lg font-bold text-ink-900 dark:text-white">{campaign.title}</p>
              {campaign.description && (
                <p className="mb-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{campaign.description}</p>
              )}
              {campaign.ctaHref && campaign.ctaLabel && (
                <Link
                  to={campaign.ctaHref}
                  onClick={onClose}
                  className="block w-full rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {campaign.ctaLabel}
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CloseCircle } from "iconsax-reactjs";
import { FaStar } from "react-icons/fa6";

export default function ReviewModal({ onClose, onSubmitted, onSubmit, subject = "product" }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
      setDone(true);
      onSubmitted?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-sm bg-white dark:bg-[#0D0D0D] rounded-2xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <div className="flex items-center gap-2 text-ink-900 dark:text-white">
              <FaStar size={16} className="text-amber-400" />
              <span className="font-semibold text-sm">{t("review.title")}</span>
            </div>
            <button
              onClick={onClose}
              className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors"
            >
              <CloseCircle size={20} />
            </button>
          </div>

          <div className="px-5 py-4">
            {done ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-success-50 dark:bg-success-500/10 flex items-center justify-center">
                  <FaStar size={20} className="text-success-600 dark:text-success-400" />
                </div>
                <p className="font-semibold text-ink-900 dark:text-white">{t("review.sentTitle")}</p>
                <p className="text-sm text-ink-400 dark:text-ink-500">{t("review.sentDesc")}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">
                  {t(subject === "company" ? "review.chooseRatingCompany" : "review.chooseRating")}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5"
                    >
                      <FaStar
                        size={28}
                        className={i <= (hoverRating || rating) ? "text-amber-400" : "text-ink-200 dark:text-ink-700"}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("review.commentPlaceholder")}
                  rows={3}
                  maxLength={500}
                  className="w-full bg-ink-50 dark:bg-[#171717] border border-ink-200 dark:border-[#1C1C1C] rounded-xl px-3.5 py-2.5 text-sm outline-none dark:text-white placeholder:text-ink-400 resize-none mb-1"
                />
                <p className="text-[11px] text-ink-400 dark:text-ink-500 text-right mb-4">
                  {comment.length}/500
                </p>

                {error && (
                  <p className="text-sm text-danger-600 dark:text-danger-400 mb-3">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!rating || loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {loading ? t("review.sending") : t("review.submit")}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CloseCircle, Flag } from "iconsax-reactjs";
import { createReport } from "../../api/api";

const REASON_KEYS = [
  { code: "SAME", labelKey: "report.reasonSame" },
  { code: "DUPLICATE", labelKey: "report.reasonDuplicate" },
  { code: "FAKE", labelKey: "report.reasonFake" },
  { code: "SCAM", labelKey: "report.reasonScam" },
  { code: "OFFENSIVE", labelKey: "report.reasonOffensive" },
];

export default function ReportModal({ targetType, targetId, onClose }) {
  const { t } = useTranslation();
  const [reasonCode, setReasonCode] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reasonCode) return;
    setLoading(true);
    setError("");
    try {
      await createReport({ targetType, targetId, reasonCode, comment: comment.trim() || undefined });
      setDone(true);
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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 dark:border-[#1C1C1C]">
            <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
              <Flag size={18} variant="Bold" />
              <span className="font-semibold text-sm">{t("report.title")}</span>
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
                  <Flag size={22} variant="Bold" className="text-success-600 dark:text-success-400" />
                </div>
                <p className="font-semibold text-ink-900 dark:text-white">{t("report.sentTitle")}</p>
                <p className="text-sm text-ink-400 dark:text-ink-500">{t("report.sentDesc")}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">{t("report.chooseReason")}</p>

                <div className="flex flex-col gap-2 mb-4">
                  {REASON_KEYS.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => setReasonCode(r.code)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                        reasonCode === r.code
                          ? "border-danger-400 dark:border-danger-500 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-300 font-medium"
                          : "border-ink-200 dark:border-[#1C1C1C] text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-600"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          reasonCode === r.code
                            ? "border-danger-500 bg-danger-500"
                            : "border-ink-300 dark:border-ink-600"
                        }`}
                      >
                        {reasonCode === r.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {t(r.labelKey)}
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("report.commentPlaceholder")}
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
                  disabled={!reasonCode || loading}
                  className="w-full bg-danger-600 hover:bg-danger-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {loading ? t("report.sending") : t("report.submit")}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

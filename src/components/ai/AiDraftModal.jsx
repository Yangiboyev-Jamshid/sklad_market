import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloseCircle } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { confirmAiDraft } from "../../api/api";

export default function AiDraftModal({ open, draftId, onClose, onConfirmed }) {
  const { t } = useTranslation();
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (sending) return;
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await confirmAiDraft(draftId, {
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        neededDate: neededDate || undefined,
        comment: comment.trim() || undefined,
      });
      onConfirmed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0D0D] rounded-t-xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-display font-bold text-ink-900 dark:text-white">
                {t("ai.draftFormTitle")}
              </h2>
              <button onClick={handleClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white transition-colors shrink-0" aria-label={t("common.close")}>
                <CloseCircle size={22} variant="Linear" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <Field label={`${t("ai.draftFormName")} *`} value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <Field
                label={`${t("ai.draftFormPhone")} *`}
                inputMode="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/[^\d+\s\-()]/g, ""))}
              />
              <Field label={t("ai.draftFormEmail")} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <Field label={t("ai.draftFormAddress")} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              <Field label={t("ai.draftFormNeededDate")} type="date" value={neededDate} onChange={(e) => setNeededDate(e.target.value)} />
              <div>
                <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{t("ai.draftFormComment")}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={sending || !contactName.trim() || !contactPhone.trim()}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
              >
                {sending ? "..." : t("ai.draftFormSubmit")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5 block">{label}</label>
      <input
        className="w-full bg-ink-50 dark:bg-[#171717] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-ink-400 dark:text-white"
        {...props}
      />
    </div>
  );
}

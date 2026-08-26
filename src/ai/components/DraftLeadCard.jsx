import { useState } from "react";
import { t } from "../i18n";

const fieldClass =
  "bg-ink-50 dark:bg-[#171717] border border-ink-200 dark:border-[#1C1C1C] rounded-lg px-3 py-2 text-sm outline-none dark:text-white placeholder:text-ink-400";

// Renders the `draft` SSE event (PLAN.md §6): an itemized lead/RFQ the model prepared, with
// editable contact fields and explicit Confirm/Cancel — nothing is sent to the seller until the
// user presses Confirm here (PLAN.md §4.2 item 3).
export default function DraftLeadCard({ draft, onConfirm, onCancel }) {
  const payload = draft.payload || {};
  const items = payload.items || [];
  const [contactName, setContactName] = useState(payload.contactName || "");
  const [contactPhone, setContactPhone] = useState(payload.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(payload.contactEmail || "");
  const [deliveryAddress, setDeliveryAddress] = useState(payload.deliveryAddress || "");
  const [neededDate, setNeededDate] = useState(payload.neededDate || "");
  const [comment, setComment] = useState(payload.comment || "");

  if (draft.status === "confirmed") {
    return (
      <div className="mt-2 rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 text-sm text-brand-700 dark:text-brand-300">
        {t("draft.confirmed", { leadId: draft.leadId ?? "—", company: payload.companyName ?? "" })}
      </div>
    );
  }

  if (draft.status === "cancelled") {
    return (
      <div className="mt-2 rounded-xl border border-ink-200 dark:border-[#1C1C1C] bg-ink-50 dark:bg-[#171717] px-4 py-3 text-sm text-ink-500 dark:text-ink-400">
        {t("draft.cancelled")}
      </div>
    );
  }

  const handleConfirm = () => {
    onConfirm({
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      neededDate: neededDate.trim() || undefined,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="mt-2 rounded-xl border border-ink-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0D0D0D] px-4 py-3.5 text-sm">
      <div className="font-semibold text-ink-900 dark:text-white mb-1">{t("draft.title")}</div>
      {payload.companyName && (
        <div className="text-ink-500 dark:text-ink-400 text-xs mb-2">
          {t("draft.company", { name: payload.companyName })}
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-1 mb-2">
          {items.map((item, i) => (
            <li key={item.slug ?? i} className="flex justify-between gap-3 text-ink-700 dark:text-ink-200">
              <span className="truncate">{item.name}</span>
              <span className="text-ink-400 shrink-0">
                {item.price} {item.currency}
              </span>
            </li>
          ))}
        </ul>
      )}
      {payload.quantity != null && (
        <div className="text-xs text-ink-500 dark:text-ink-400 mb-3">
          {t("draft.quantity", { count: payload.quantity })}
        </div>
      )}

      <div className="flex flex-col gap-2 mb-3">
        <input
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder={t("draft.contactName")}
          className={fieldClass}
        />
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder={t("draft.contactPhone")}
          className={fieldClass}
        />
        <input
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder={t("draft.contactEmail")}
          className={fieldClass}
        />
        <input
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder={t("draft.deliveryAddress")}
          className={fieldClass}
        />
        <input
          value={neededDate}
          onChange={(e) => setNeededDate(e.target.value)}
          placeholder={t("draft.neededDate")}
          type="date"
          className={fieldClass}
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("draft.comment")}
          rows={2}
          className={`${fieldClass} resize-none`}
        />
      </div>

      {draft.error && <div className="text-danger-600 text-xs mb-2">{t("draft.error")}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={draft.pending}
          className="flex-1 bg-brand-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("draft.confirm")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={draft.pending}
          className="flex-1 border border-ink-200 dark:border-[#1C1C1C] text-ink-600 dark:text-ink-300 rounded-lg py-2 text-sm font-semibold hover:border-ink-300 dark:hover:border-ink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("draft.cancel")}
        </button>
      </div>
    </div>
  );
}

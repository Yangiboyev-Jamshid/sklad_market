import { useState, useEffect } from "react";
import { Messages2, Box } from "iconsax-reactjs";
import { BsCheck } from "react-icons/bs";
import { IoIosClose } from "react-icons/io";
import { getSellerLeads, updateLeadStatus } from "../../api/api";

const STATUS_MAP = {
  NEW:       { label: "Новый",     cls: "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400" },
  VIEWED:    { label: "Просмотрен", cls: "bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400" },
  CONTACTED: { label: "В обработке", cls: "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400" },
  CLOSED:    { label: "Закрыт",     cls: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-500 dark:text-ink-400" },
  CANCELED:  { label: "Отменён",    cls: "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400" },
};

function badge(status) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-ink-100 text-ink-500" };
  return <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function RequestsTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    getSellerLeads({ page: 1, perPage: 50 })
      .then((data) => setLeads(data?.items ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (id, status, closeReason) => {
    setActionId(id);
    try {
      const updated = await updateLeadStatus(id, { status, closeReason });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: updated?.status ?? status } : l)));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">
        Запросы на покупку
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-400 gap-2">
          <Box size={36} />
          <p className="text-sm">Запросов пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => {
            const busy = actionId === lead.id;
            const firstItem = lead.items?.[0];
            const canAct = lead.status === "NEW";
            return (
              <div
                key={lead.id}
                className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4 transition-opacity ${busy ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {initials(lead.contactName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-ink-900 dark:text-white">{lead.contactName || "Без имени"}</p>
                      {badge(lead.status)}
                    </div>
                    {firstItem && (
                      <p className="text-xs text-ink-400 truncate">
                        {firstItem.productNameSnapshot} × {firstItem.quantity}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-400">
                      {lead.contactPhone && <span>{lead.contactPhone}</span>}
                      {lead.neededDate && <span>До: {lead.neededDate}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 overflow-x-auto">
                  {canAct && (
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-3">
                      <button
                        disabled={busy}
                        onClick={() => changeStatus(lead.id, "CONTACTED")}
                        className="flex w-full sm:w-auto justify-center items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white text-xs font-medium px-3 py-3 sm:py-2 rounded-xl transition-colors whitespace-nowrap"
                      >
                        <BsCheck className="text-[18px]" /> Принять
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => changeStatus(lead.id, "CANCELED", "Отклонено продавцом")}
                        className="flex w-full sm:w-auto justify-center items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white text-xs font-medium px-3 py-3 sm:py-2 rounded-xl transition-colors whitespace-nowrap"
                      >
                        <IoIosClose className="text-[18px]" /> Отклонить
                      </button>
                    </div>
                  )}
                  <button className="flex w-full sm:w-auto justify-center items-center gap-1.5 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 text-xs font-medium px-3 py-3 sm:py-2 rounded-xl text-ink-700 dark:text-ink-200 transition-colors whitespace-nowrap">
                    <Messages2 size={14} /> Написать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

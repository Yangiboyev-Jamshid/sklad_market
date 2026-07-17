import { useState, useEffect, useRef } from "react";
import { Box } from "iconsax-reactjs";
import { IoIosClose } from "react-icons/io";
import AppShell from "../components/layout/AppShell";
import { getLeads, updateLeadStatus } from "../api/api";

const STATUS_MAP = {
  NEW:       { label: "Новый",      cls: "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400" },
  VIEWED:    { label: "Просмотрен", cls: "bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400" },
  CONTACTED: { label: "В обработке", cls: "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400" },
  CLOSED:    { label: "Закрыт",     cls: "bg-ink-100 dark:bg-[#1C1C1C] text-ink-500 dark:text-ink-400" },
  CANCELED:  { label: "Отменён",    cls: "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400" },
};

function badge(status) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-ink-100 text-ink-500" };
  return <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

export default function RequestsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const submittingIdsRef = useRef(new Set());

  useEffect(() => {
    getLeads({ page: 1, perPage: 50 })
      .then((data) => setLeads(data?.items ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  const cancelRequest = async (id) => {
    if (submittingIdsRef.current.has(id)) return;
    submittingIdsRef.current.add(id);
    setActionId(id);
    try {
      const updated = await updateLeadStatus(id, { status: "CANCELED" });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: updated?.status ?? "CANCELED" } : l)));
    } catch (err) {
      alert(err.message);
    } finally {
      submittingIdsRef.current.delete(id);
      setActionId(null);
    }
  };

  return (
    <AppShell>
      <div className="p-5 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white mb-5 sm:mb-6">
          Мои запросы
        </h1>

        <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-400 gap-2">
              <Box size={36} />
              <p className="text-sm">Вы пока не отправляли запросы</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.map((lead) => {
                const busy = actionId === lead.id;
                const items = lead.items ?? [];
                const total = items.reduce((sum, it) => sum + (it.priceSnapshot ?? 0) * (it.quantity ?? 0), 0);
                return (
                  <div
                    key={lead.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4 transition-opacity ${busy ? "opacity-50" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">
                          Запрос №{lead.id}
                        </p>
                        {badge(lead.status)}
                      </div>
                      {items.length > 0 && (
                        <p className="text-xs text-ink-400 truncate">
                          {items.map((it) => `${it.productNameSnapshot} × ${it.quantity}`).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-400">
                        {total > 0 && <span>Сумма: {total.toLocaleString()} сум</span>}
                        {lead.neededDate && <span>До: {lead.neededDate}</span>}
                      </div>
                    </div>

                    {lead.status === "NEW" && (
                      <button
                        disabled={busy}
                        onClick={() => cancelRequest(lead.id)}
                        className="shrink-0 flex items-center justify-center gap-1.5 border border-ink-200 dark:border-[#1C1C1C] hover:border-danger-300 hover:text-danger-600 dark:hover:text-danger-400 text-xs font-medium px-3 py-2.5 rounded-xl text-ink-700 dark:text-ink-200 transition-colors whitespace-nowrap"
                      >
                        <IoIosClose className="text-[18px]" /> Отменить запрос
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

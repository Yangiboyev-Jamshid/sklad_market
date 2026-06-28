import { useState } from "react";
import { TickCircle, Messages2, CloseSquare } from "iconsax-reactjs";
import { purchaseRequests } from "../../data/mockData";

const statusMap = {
  new: { label: "Новый", className: "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400" },
  processing: { label: "В обработке", className: "bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400" },
  done: { label: "Выполнено", className: "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400" },
};

export default function RequestsTab() {
  const [requests, setRequests] = useState(purchaseRequests);

  const updateStatus = (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">Запросы на покупку</p>
      <div className="flex flex-col gap-3">
        {requests.map((r) => {
          const status = statusMap[r.status];
          return (
            <div key={r.id} className="group cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-600 text-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0">
                  {r.company.slice(" ")[0][0].toUpperCase() + r.company.slice(" ")[1][0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{r.company}</p>
                    {r.verified && <TickCircle size={20} className="text-brand-500" variant="Outline" />}
                    <span className={`text-xs font-medium px-1 py-0.5 rounded-[4px] ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-[#7F7F7F] mt-1">{r.item}</p>
                  <p className="text-xs text-[#7F7F7F] mt-1">{r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                <div className="flex items-center gap-2 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                  <button
                    onClick={() => updateStatus(r.id, "processing")}
                    className="flex items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <TickCircle size={24} variant="Outline" />
                    Принять
                  </button>
                  <button className="flex items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                    <CloseSquare size={24} variant="Outline" /> Отклонить
                  </button>
                </div>
                <button className="flex items-center gap-1.5 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl text-ink-700 dark:text-ink-200 transition-colors whitespace-nowrap">
                  <Messages2 size={16} /> Написать
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Box1, Buildings2, Message2, Warning2, Slash } from "iconsax-reactjs";
import { complaints } from "../../data/mockData";

const iconFor = (id) => {
  if (id === "cx2") return Buildings2;
  if (id === "cx3") return Message2;
  return Box1;
};

export default function ComplaintsTab() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-ink-900 dark:text-white mb-4 sm:mb-5">Жалобы и нарушения</p>
      <div className="flex flex-col gap-3">
        {complaints.map((c) => {
          const Icon = iconFor(c.id);
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} className="border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <Icon size={20} variant="Bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{c.title}</p>
                    <p className="text-xs text-ink-400">{c.company}</p>
                    <p className="text-xs text-ink-300 dark:text-ink-600 mb-1">{c.date}</p>
                    <span className="text-[11px] font-medium bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400 px-2 py-0.5 rounded-full">
                      {c.reason}
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="block text-xs text-brand-600 dark:text-brand-400 mt-1.5 hover:underline"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                  <button className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full text-ink-400 bg-ink-100 dark:bg-[#171717] whitespace-nowrap">Отклонить жалобу</button>
                  <button className="flex items-center gap-1.5 bg-warning-500 hover:bg-warning-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                    <Warning2 size={16} /> Предупредить
                  </button>
                  <button className="flex items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                    <Slash size={16} /> Заблокировать
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-ink-100 dark:border-[#1C1C1C] text-sm text-ink-600 dark:text-ink-300">{c.detail}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

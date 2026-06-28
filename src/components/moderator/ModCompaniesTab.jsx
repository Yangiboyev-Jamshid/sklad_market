import { TickCircle, CloseCircle } from "iconsax-reactjs";
import { companyVerifications } from "../../data/mockData";

export default function ModCompaniesTab() {
  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-ink-900 dark:text-white mb-4 sm:mb-5">Верификация компаний</p>
      <div className="flex flex-col gap-3">
        {companyVerifications.map((c) => (
          <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4">
            <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{c.name}</p>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                      c.status === "ready"
                        ? "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400"
                        : "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400"
                    }`}
                  >
                    {c.status === "ready" ? "Готов к верификации" : "Проблемы"}
                  </span>
                </div>
                <p className="text-xs text-ink-400 mb-1.5">{c.industry}</p>
                <p className="text-xs text-ink-400 mb-1.5">Документы</p>
                <div className="flex gap-2 flex-wrap">
                  {c.docs.map((doc) => (
                    <span
                      key={doc.name}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        doc.ok
                          ? "bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                          : "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400"
                      }`}
                    >
                      {doc.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                <TickCircle size={16} /> Принять
              </button>
              <button className="flex items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                <CloseCircle size={16} /> Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Camera, Verify } from "iconsax-reactjs";
import { tariffPlans } from "../../data/mockData";

export default function SettingsTab() {
  const fields = [
    { label: "Название компании", value: "Алтын Цемент" },
    { label: "Отрасль", value: "Металлургия" },
    { label: "Телефон", value: "+998 91 123 45 67" },
    { label: "Email", value: "info@altincement.uz" },
    { label: "Сайт", value: "www.altincement.uz" },
    { label: "Город", value: "Ташкент" },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 dark:text-white mb-4 sm:mb-5">Прифоль компании</p>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              АЦ
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                Алтын Цемент <Verify size={14} variant="Bold" className="text-brand-500" />
              </p>
              <p className="text-xs text-ink-400">Металлургия Ташкент, Узбекистан</p>
            </div>
          </div>
          <button className="flex items-center gap-2 border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 text-sm font-medium px-4 py-2.5 rounded-full text-ink-700 dark:text-ink-200 transition-colors shrink-0">
            <Camera size={16} /> Логотип
          </button>
        </div>

        <div className="flex flex-col">
          {fields.map((f, i) => (
            <div key={f.label} className={`flex items-center justify-between gap-3 py-3.5 ${i !== 0 ? "border-t border-ink-100 dark:border-[#1C1C1C]" : ""}`}>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">{f.label}</p>
                <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{f.value}</p>
              </div>
              <button className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline shrink-0">Изменить</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 dark:text-white mb-4 sm:mb-5">Тарифный план</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {tariffPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 border ${
                plan.highlight
                  ? "border-brand-400 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-500/10"
                  : "border-ink-100 dark:border-[#1C1C1C]"
              }`}
            >
              <p className="font-semibold text-ink-900 dark:text-white">{plan.name}</p>
              <p className="text-sm text-ink-400 mb-3">{plan.price}</p>
              <ul className="flex flex-col gap-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-ink-600 dark:text-ink-300 flex items-center gap-2">
                    <span className="text-brand-500 dark:text-brand-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

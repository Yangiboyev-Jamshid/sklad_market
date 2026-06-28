import { motion } from "framer-motion";
import { Box1, Buildings2, Flag } from "iconsax-reactjs";
import ProductThumb from "../ui/ProductThumb";

export default function ModOverviewTab() {
  const actions = [
    { name: "Оцинкованный рулон", company: "Asia Steel Group", price: "от 610 $ / тонна", status: "Продано", statusType: "success", time: "10 мин назад" },
    { name: "Оцинкованный рулон", company: "Asia Steel Group", reason: "Причина: Не хватает продукции", status: "Отказано", statusType: "danger", time: "10 мин назад" },
    { name: "Asia Steel Group", company: "", reason: "Причина: Мошенничество", status: "Отказано", statusType: "danger", time: "20 мин назад", isCompany: true },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="На проверке товаров" value="24" icon={Box1} />
        <StatCard label="Компании в ожидании" value="7" icon={Buildings2} />
        <StatCard label="Жалобы" value="7" icon={Flag} />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 dark:text-white mb-4">Последние действии</p>
        <div className="flex flex-col gap-3">
          {actions.map((a, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
              {a.isCompany ? (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0">
                  <ProductThumb shape="coil" className="w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{a.name}</p>
                {a.company && <p className="text-xs text-ink-400">{a.company}</p>}
                {a.reason ? (
                  <p className="text-xs text-ink-400">{a.reason}</p>
                ) : (
                  <p className="text-xs text-ink-400">{a.price}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-medium px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                    a.statusType === "success"
                      ? "bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-400"
                      : "bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400"
                  }`}
                >
                  {a.status}
                </span>
                <p className="text-[11px] text-ink-300 dark:text-ink-600 mt-1">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-ink-50/70 dark:bg-[#171717] rounded-2xl p-4 sm:p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white bg-purple-500 shrink-0">
        <Icon size={20} variant="Bold" />
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { TickCircle, CloseCircle } from "iconsax-reactjs";
import PillToggle from "../ui/PillToggle";
import ProductThumb from "../ui/ProductThumb";
import { moderationProducts } from "../../data/mockData";

export default function ModProductsTab() {
  const [subTab, setSubTab] = useState("pending");

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="overflow-x-auto">
        <PillToggle
          options={[
            { value: "pending", label: "Товары на проверке" },
            { value: "mine", label: "Мои товары" },
            { value: "draft", label: "Черновик" },
          ]}
          value={subTab}
          onChange={setSubTab}
          className="w-full"
        />
      </div>

      <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
        <p className="font-semibold text-ink-900 dark:text-white mb-4">Товары на проверке</p>
        <div className="flex flex-col gap-3">
          {moderationProducts.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-4">
              <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <ProductThumb shape="coil" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-ink-400 mb-1">{p.company}</p>
                  {p.description ? (
                    <p className="text-xs text-ink-500 dark:text-ink-400 max-w-md">{p.description}</p>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {p.issues.map((issue) => (
                        <span key={issue} className="text-[11px] font-medium bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400 px-2 py-0.5 rounded-full">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-ink-300 dark:text-ink-600 mt-1">{p.date}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                <p className="font-bold text-brand-600 dark:text-brand-400">${p.price}</p>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 bg-success-500 hover:bg-success-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                    <TickCircle size={16} /> Одобрить
                  </button>
                  <button className="flex items-center gap-1.5 bg-danger-500 hover:bg-danger-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                    <CloseCircle size={16} /> Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

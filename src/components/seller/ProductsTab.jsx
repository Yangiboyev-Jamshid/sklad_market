import { Edit2, Trash } from "iconsax-reactjs";
import ProductThumb from "../ui/ProductThumb";

export default function ProductsTab() {
  const items = [1, 2, 3];
  return (
    <div className="bg-white dark:bg-[#0D0D0D] rounded-2xl border border-ink-100 dark:border-[#1C1C1C] p-4 sm:p-6 transition-colors">
      <p className="font-semibold text-[24px] text-ink-900 dark:text-white mb-4 sm:mb-5">Список товаров</p>
      <div className="flex flex-col gap-3">
        {items.map((i) => (
          <div key={i} className="flex items-start gap-3 sm:gap-4 border border-ink-100 dark:border-[#1C1C1C] rounded-xl p-3">
            <div className="w-14 h-14 sm:w-[126px] sm:h-[66px] flex items-center justify-center bg-[#E2E2E2] dark:bg-[#2A2A2A] overflow-hidden shrink-0">
              <ProductThumb shape="coil" width="21" height="8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">Оцинкованный рулон</p>
              <p className="text-[8.25px] text-ink-400 mt-3">Asia Steel Group</p>
              <p className="text-[8.25px] text-ink-400 mt-3">от 610 $ / тонна</p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3 text-ink-400">
              <button className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors p-1">
                <Edit2 size={24} />
              </button>
              <button className="hover:text-danger-500 transition-colors p-1">
                <Trash size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

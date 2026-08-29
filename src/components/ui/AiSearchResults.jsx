import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building, Box } from "iconsax-reactjs";
import ProductThumb from "./ProductThumb";

export default function AiSearchResults({ items, loading, onSelect }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!loading && (!items || items.length === 0)) return null;

  const goTo = (item) => {
    onSelect?.();
    if (item.type === "COMPANY") navigate(`/company/${item.slug || item.id}`);
    else navigate(`/product/${item.slug || item.id}`);
  };

  return (
    <div className="border-t border-ink-100 dark:border-[#1C1C1C]">
      <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
        {t("ai.poweredBy")}
      </p>
      {loading ? (
        <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="pb-1.5">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goTo(item)}
                className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#EBEBEB] dark:bg-[#2A2A2A] shrink-0 flex items-center justify-center">
                  {item.type === "COMPANY" ? (
                    item.logoUrl ? <img src={item.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building size={18} className="text-ink-400" />
                  ) : item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ProductThumb />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 truncate flex items-center gap-1">
                    {item.type === "COMPANY" ? (
                      <>
                        <Building size={12} /> {item.productCount ?? 0} {t("ai.supplierRecommendProducts")}
                      </>
                    ) : (
                      <>
                        <Box size={12} /> {Number(item.price ?? 0).toLocaleString()} {item.currency}
                      </>
                    )}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

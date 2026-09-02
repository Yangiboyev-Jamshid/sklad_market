import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Building, Box } from "iconsax-reactjs";
import ProductThumb from "./ProductThumb";

export default function SearchSuggestions({ products, loading, onSelect, aiItems = [], aiLoading = false, align = "left" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goTo = (product) => {
    onSelect?.();
    navigate(`/product/${product.slug || product.id}`);
  };

  const goToAiItem = (item) => {
    onSelect?.();
    if (item.type === "COMPANY") navigate(`/company/${item.slug || item.id}`);
    else navigate(`/product/${item.slug || item.id}`);
  };

  const showAiColumn = aiLoading || aiItems.length > 0;
  const anchorClass = align === "right" && showAiColumn
    ? "right-0 w-[min(640px,calc(100vw-2rem))]"
    : "left-0 right-0";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        className={`absolute top-full mt-2 z-30 bg-white dark:bg-[#0D0D0D] border border-ink-100 dark:border-[#1C1C1C] rounded-2xl shadow-xl overflow-hidden ${anchorClass} ${showAiColumn ? "grid grid-cols-2 divide-x divide-ink-100 dark:divide-[#1C1C1C]" : ""
          }`}
      >
        <div className="min-w-0">
          <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {t("home.searchResults")}
          </p>
          {loading ? (
            <div className="flex flex-col gap-1.5 p-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-ink-400 dark:text-ink-500 text-center py-6 px-4">{t("common.noSuggestions")}</p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1.5">
              {products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(p)}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-ink-50 dark:hover:bg-[#171717] transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#EBEBEB] dark:bg-[#2A2A2A] shrink-0 flex items-center justify-center">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ProductThumb />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-ink-400 dark:text-ink-500 truncate">
                        {Number(p.price ?? 0).toLocaleString()} {p.unit}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showAiColumn && (
          <div className="min-w-0">
            <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500 dark:text-brand-400">
              {t("ai.poweredBy")}
            </p>
            {aiLoading ? (
              <div className="flex flex-col gap-1.5 p-2.5">
                {[1, 2].map((i) => (
                  <div key={i} className="h-11 rounded-xl bg-ink-100 dark:bg-[#171717] animate-pulse" />
                ))}
              </div>
            ) : aiItems.length === 0 ? (
              <p className="text-sm text-ink-400 dark:text-ink-500 text-center py-6 px-4">{t("ai.searchNoResults")}</p>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto py-1.5">
                {aiItems.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToAiItem(item)}
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
                              <Building size={12} /> {item.productCount ?? 0} {t("ai.productsLabel")}
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
        )}
      </motion.div>
    </AnimatePresence>
  );
}

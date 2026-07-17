import { useNavigate } from "react-router-dom";
import { Heart } from "iconsax-reactjs";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ProductThumb from "./ProductThumb";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ product, index = 0 }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart, favorites, toggleFavorite } = useCart();
  const isFav = favorites?.has(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      className="bg-white dark:bg-[#0D0D0D] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-ink-100 dark:border-[#1C1C1C] flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all"
      onClick={() => navigate(`/product/${product.slug || product.id}`)}
    >
      <div className="relative h-[150px] sm:h-[220px] w-full flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden bg-[#EBEBEB] dark:bg-[#2A2A2A]" style={{ aspectRatio: "1 / 1" }}>
        {product.image
          ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          : <ProductThumb />
        }

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0D0D0D] shadow-md flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart
            size={20}
            variant={isFav ? "Bold" : "Linear"}
            className={isFav ? "text-red-500" : "text-ink-500 dark:text-ink-300"}
          />
        </button>
      </div>

      <div className="flex flex-col flex-1 pt-4 px-1 pb-1 gap-1">
        <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-[12px] sm:text-sm font-bold text-ink-900 dark:text-white leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
          {product.verified && (
            <span className="shrink-0 text-[10px] sm:text-sm px-1.5 sm:px-2 py-[2px] rounded-[5px] bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
              {t("common.verified")}
            </span>
          )}
        </div>

        {/* Company name */}
        <p className="text-[10px] sm:text-[8.25px] font-[400] text-ink-400 dark:text-[#7F7F7F]"><span translate="no" className="notranslate">{product.company}</span></p>

        {/* Price + Add to cart button */}
        <div className="flex sm:flex-row flex-col items-start sm:items-center justify-between mt-3 gap-2">
          <p className="text-[10px] sm:text-[8.25px] text-ink-500 dark:text-[#7F7F7F] whitespace-nowrap">
            {t("common.from")} <span>{Number(product.price ?? 0).toLocaleString()}</span> {product.unit}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="shrink-0 px-2 sm:px-3 dark:text-[#0D0D0D] py-0.5 sm:py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-[12px] sm:text-[9.43px] font-semibold rounded-full transition-all whitespace-nowrap"
          >
            {t("common.addToCart")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

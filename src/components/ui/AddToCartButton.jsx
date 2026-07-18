import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TickCircle } from "iconsax-reactjs";
import { useTranslation } from "react-i18next";
import { useCart } from "../../context/CartContext";
import { flyToCart } from "../../utils/cartFly";

// Drop-in replacement for a plain "add to cart" <button>: keeps the caller's
// className/content for the idle state, adds a fly-to-cart burst on click and
// a brief "added" confirmation state.
export default function AddToCartButton({ product, imageUrl, className = "", iconSize = 16, children }) {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const btnRef = useRef(null);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (status === "loading") return;
    flyToCart({ imageUrl, sourceEl: btnRef.current });
    setStatus("loading");
    try {
      await addToCart(product);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1400);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <motion.button
      ref={btnRef}
      type="button"
      disabled={status === "loading"}
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
      animate={status === "done" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ opacity: status === "loading" ? 0.85 : 1 }}
      className={className}
    >
      <AnimatePresence mode="wait" initial={false}>
        {status === "done" ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center gap-1.5"
          >
            <TickCircle size={iconSize} variant="Bold" />
            {t("common.added")}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center gap-1.5"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

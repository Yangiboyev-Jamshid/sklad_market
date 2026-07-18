import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCartIconEl } from "../../utils/cartFly";

let uid = 0;

// Renders a short-lived clone of the clicked product that arcs from the
// "add to cart" button to the header cart icon, then bumps the icon on arrival.
export default function FlyToCartLayer() {
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const targetEl = getCartIconEl();
      if (!targetEl) return;
      const { imageUrl, sourceRect } = e.detail;
      const targetRect = targetEl.getBoundingClientRect();
      const size = Math.min(sourceRect.width, sourceRect.height, 56) || 40;

      const from = { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 };
      const to = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };
      const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 120 };

      setFlights((prev) => [...prev, { id: ++uid, imageUrl, size, from, mid, to }]);
    };
    window.addEventListener("fly-to-cart", handler);
    return () => window.removeEventListener("fly-to-cart", handler);
  }, []);

  const remove = useCallback((id) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
    window.dispatchEvent(new CustomEvent("cart-bump"));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: f.size,
              height: f.size,
              marginLeft: -f.size / 2,
              marginTop: -f.size / 2,
            }}
            initial={{ x: f.from.x, y: f.from.y, scale: 1, opacity: 1 }}
            animate={{
              x: [f.from.x, f.mid.x, f.to.x],
              y: [f.from.y, f.mid.y, f.to.y],
              scale: [1, 1.05, 0.2],
              opacity: [1, 1, 0.6],
            }}
            transition={{ duration: 0.75, ease: [0.33, 0, 0.2, 1], times: [0, 0.45, 1] }}
            onAnimationComplete={() => remove(f.id)}
            className="rounded-full overflow-hidden shadow-xl ring-2 ring-white dark:ring-[#0D0D0D] bg-brand-500"
          >
            {f.imageUrl ? (
              <img src={f.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-500" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

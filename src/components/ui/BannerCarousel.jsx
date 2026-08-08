import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

const AUTOPLAY_MS = 4500;
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 400;

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
};

const DESKTOP_BREAKPOINT_PX = 640;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT_PX
  );
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export default function BannerCarousel({ banners, heightClass = "h-44 sm:h-[50vh]", perView = 1 }) {
  const isDesktop = useIsDesktop();
  const effectivePerView = isDesktop ? perView : 1;

  const groups = [];
  for (let i = 0; i < banners.length; i += effectivePerView) {
    groups.push(banners.slice(i, i + effectivePerView));
  }

  const [[index, direction], setSlide] = useState([0, 0]);
  const [paused, setPaused] = useState(false);
  const wasDragged = useRef(false);
  const count = groups.length;

  const paginate = useCallback((dir) => {
    setSlide(([current]) => [(current + dir + count) % count, dir]);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => paginate(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, paginate]);

  if (count === 0) return null;
  const safeIndex = ((index % count) + count) % count;
  const group = groups[safeIndex];

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative ${heightClass} w-full`}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={safeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 320, damping: 34 }, opacity: { duration: 0.15 } }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragStart={() => { wasDragged.current = false; }}
            onDrag={(e, info) => { if (Math.abs(info.offset.x) > 8) wasDragged.current = true; }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) paginate(1);
              else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) paginate(-1);
            }}
            className="absolute inset-0 grid gap-3"
            style={{ gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))` }}
          >
            {group.map((banner) => (
              <a
                key={banner.id}
                href={banner.href || undefined}
                target={banner.href ? "_blank" : undefined}
                rel={banner.href ? "noopener noreferrer" : undefined}
                onClick={(e) => { if (wasDragged.current) e.preventDefault(); }}
                className={`block h-full rounded-2xl overflow-hidden ${banner.href ? "cursor-pointer" : "cursor-default"}`}
              >
                <img src={banner.img} alt="banner" className="w-full h-full object-cover pointer-events-none" draggable={false} />
              </a>
            ))}
          </motion.div>
        </AnimatePresence>
        {effectivePerView === 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
        )}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            aria-label="Previous banner"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-black/70 text-ink-900 dark:text-white backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-black active:scale-90 transition-all"
          >
            <ArrowLeft2 size={20} />
          </button>
          <button
            onClick={() => paginate(1)}
            aria-label="Next banner"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-black/70 text-ink-900 dark:text-white backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-black active:scale-90 transition-all"
          >
            <ArrowRight2 size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {groups.map((g, i) => (
              <button
                key={g.map((b) => b.id).join("-")}
                onClick={() => setSlide([i, i > safeIndex ? 1 : -1])}
                aria-label={`Banner slide ${i + 1}`}
                className="p-1 -m-1"
              >
                <motion.span
                  animate={{ width: i === safeIndex ? 20 : 6, opacity: i === safeIndex ? 1 : 0.55 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="block h-1.5 rounded-full bg-white shadow-sm"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

const AUTOPLAY_MS = 4000;

export default function BannerCarousel({ banners }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const scrollingRef = useRef(false);

  const scrollToIndex = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;
    scrollingRef.current = true;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  }, []);

  const goPrev = () => scrollToIndex((activeIndex - 1 + banners.length) % banners.length);
  const goNext = () => scrollToIndex((activeIndex + 1) % banners.length);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      const next = (activeIndex + 1) % banners.length;
      scrollToIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [activeIndex, banners.length, scrollToIndex]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(index);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-2xl"
      >
        {banners.map((b, i) => (
          <motion.a
            key={b.id}
            href={b.href || undefined}
            target={b.href ? "_blank" : undefined}
            rel={b.href ? "noopener noreferrer" : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`overflow-hidden relative h-44 sm:h-[50vh] w-full shrink-0 snap-center flex items-center justify-center ${b.href ? "cursor-pointer" : "cursor-default"}`}
          >
            <img src={b.img} alt="banner" className="object-cover w-full h-full" />
          </motion.a>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous banner"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-black text-ink-900 dark:text-white backdrop-blur-sm hover:bg-ink-100 dark:hover:bg-[#1C1C1C] active:scale-90 transition-all"
          >
            <ArrowLeft2 size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next banner"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-black text-ink-900 dark:text-white backdrop-blur-sm hover:bg-ink-100 dark:hover:bg-[#1C1C1C] active:scale-90 transition-all"
          >
            <ArrowRight2 size={20} />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <AnimatePresence initial={false}>
            {banners.map((b, i) => (
              <motion.button
                key={b.id}
                onClick={() => scrollToIndex(i)}
                animate={{ width: i === activeIndex ? 18 : 6 }}
                className={`h-1.5 rounded-full transition-colors ${i === activeIndex ? "bg-white" : "bg-white/50"}`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

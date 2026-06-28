import { useEffect, useRef, useState } from "react";
import { Star1 } from "iconsax-reactjs";
import { AnimatePresence, motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../../context/ThemeContext";

// Real map (OpenStreetMap tiles via Leaflet) as the background, with the
// same percentage-based pin overlay API as before (pin.x / pin.y are 0-100).
// The base map view (center + zoom) is fixed and non-interactive so that the
// percentage-positioned pins stay visually stable on top of it.

const TASHKENT_CENTER = [41.2995, 69.2401];
const DEFAULT_ZOOM = 13;

const TILE_URLS = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

export default function MapView({ pins = [], height = "h-[460px]", center }) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [active, setActive] = useState(null);
  const [ready, setReady] = useState(false);

  // Initialize the Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: TASHKENT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      tap: false,
    });

    mapRef.current = map;
    setReady(true);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Swap tile layer when the theme changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const url = theme === "dark" ? TILE_URLS.dark : TILE_URLS.light;
    const layer = L.tileLayer(url, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      subdomains: "abcd",
    });

    layer.addTo(mapRef.current);
    tileLayerRef.current = layer;
  }, [theme, ready]);

  // Keep the map sized correctly if the container becomes visible later
  // (e.g. switching from grid view to map view)
  useEffect(() => {
    if (!mapRef.current) return;
    const id = requestAnimationFrame(() => mapRef.current?.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [ready, height]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden transition-colors`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {center && (
        <div
          className="absolute w-8 h-8 rounded-full bg-brand-400/30 flex items-center justify-center z-10"
          style={{ left: `${center.x}%`, top: `${center.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white dark:border-ink-900" />
        </div>
      )}

      {pins.map((pin, i) => {
        const isActive = active === (pin.id || i);
        const openLeft = pin.x > 62;
        const openTop = pin.y < 30;

        return (
          <button
            key={pin.id || i}
            onMouseEnter={() => setActive(pin.id || i)}
            onMouseLeave={() => setActive(null)}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group z-10"
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-popover border-2 border-white dark:border-ink-900 ${pin.color === "red" ? "bg-danger-500" : "bg-brand-500"
                }`}
              style={{ borderBottomLeftRadius: "2px" }}
            >
              {pin.label ?? i + 1}
            </motion.div>
            <div className="w-2 h-2 rotate-45 bg-current -mt-1.5" style={{ color: pin.color === "red" ? "#F04438" : "#3B6FF6" }} />

            <AnimatePresence>
              {isActive && pin.popover && (
                <motion.div
                  initial={{ opacity: 0, y: openTop ? -6 : 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: openTop ? 8 : -8, scale: 1 }}
                  exit={{ opacity: 0, y: openTop ? -6 : 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute w-56 sm:w-60 bg-white dark:bg-[#0D0D0D] rounded-xl shadow-popover border border-ink-100 dark:border-[#1C1C1C] p-1 z-20 text-left
                    ${openTop ? "top-full mt-3" : "bottom-full mb-3"}
                    ${openLeft ? "right-0" : "left-0"}
                  `}
                >
                  {pin.popover.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-[#171717] rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                          {item.name}
                          <span className="text-brand-500">✓</span>
                        </p>
                        <p className="text-[11px] text-ink-400">{item.company}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star1 key={s} size={11} variant="Bold" className={s <= item.rating ? "text-amber-400" : "text-ink-200 dark:text-ink-700"} />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
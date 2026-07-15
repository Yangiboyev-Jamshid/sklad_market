import { useEffect, useRef, useState, useCallback } from "react";
import { Star1 } from "iconsax-reactjs";
import { AnimatePresence, motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../../context/ThemeContext";

const TASHKENT_CENTER = [41.2995, 69.2401];
const DEFAULT_ZOOM = 13;
const SINGLE_POINT_ZOOM = 15;
const FIT_MAX_ZOOM = 15;

const TILE_URLS = {
  light: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

function hasCoords(p) {
  return !!p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
}

export default function MapView({ pins = [], height = "h-[460px]", center }) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pinsRef = useRef(pins);
  const centerRef = useRef(center);
  const myLocationRef = useRef(null);
  const [active, setActive] = useState(null);
  const [ready, setReady] = useState(false);
  const [positions, setPositions] = useState({});
  const [myLocation, setMyLocation] = useState(null);

  useEffect(() => {
    pinsRef.current = pins;
    centerRef.current = center;
  }, [pins, center]);

  useEffect(() => {
    myLocationRef.current = myLocation;
  }, [myLocation]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const recomputePositions = useCallback(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;

    const next = {};
    (pinsRef.current || []).forEach((pin, i) => {
      const key = pin.id ?? i;
      if (hasCoords(pin)) {
        const point = map.latLngToContainerPoint([pin.lat, pin.lng]);
        next[key] = { x: (point.x / w) * 100, y: (point.y / h) * 100 };
      } else if (typeof pin.x === "number" && typeof pin.y === "number") {
        next[key] = { x: pin.x, y: pin.y };
      }
    });

    const c = centerRef.current;
    if (hasCoords(c)) {
      const point = map.latLngToContainerPoint([c.lat, c.lng]);
      next.__center = { x: (point.x / w) * 100, y: (point.y / h) * 100 };
    } else if (c && typeof c.x === "number" && typeof c.y === "number") {
      next.__center = { x: c.x, y: c.y };
    }

    const me = myLocationRef.current;
    if (hasCoords(me)) {
      const point = map.latLngToContainerPoint([me.lat, me.lng]);
      next.__me = { x: (point.x / w) * 100, y: (point.y / h) * 100 };
    }

    setPositions(next);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: TASHKENT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
    });
    map.zoomControl.setPosition("bottomright");

    mapRef.current = map;
    setReady(true);

    map.on("move zoom", recomputePositions);
    const onResize = () => {
      map.invalidateSize();
      recomputePositions();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.off("move zoom", recomputePositions);
      map.remove();
      mapRef.current = null;
    };
  }, [recomputePositions]);

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

    layer.on("tileerror", (e) => {
      if (e.tile.dataset.retried) return;
      e.tile.dataset.retried = "1";
      const original = e.tile.src;
      setTimeout(() => {
        e.tile.src = `${original}${original.includes("?") ? "&" : "?"}retry=${Date.now()}`;
      }, 800);
    });

    layer.addTo(mapRef.current);
    tileLayerRef.current = layer;
  }, [theme, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const points = [];
    pins.forEach((p) => {
      if (hasCoords(p)) points.push([p.lat, p.lng]);
    });
    if (hasCoords(center)) points.push([center.lat, center.lng]);
    if (hasCoords(myLocation)) points.push([myLocation.lat, myLocation.lng]);

    if (points.length === 1) {
      map.setView(points[0], SINGLE_POINT_ZOOM, { animate: false });
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: FIT_MAX_ZOOM, animate: false });
    }

    const id = requestAnimationFrame(() => {
      map.invalidateSize();
      recomputePositions();
    });
    return () => cancelAnimationFrame(id);
  }, [pins, center, myLocation, ready, height, recomputePositions]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden transition-colors`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {center && positions.__center && (
        <div
          className="absolute w-8 h-8 rounded-full bg-brand-400/30 flex items-center justify-center z-10"
          style={{ left: `${positions.__center.x}%`, top: `${positions.__center.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white dark:border-ink-900" />
        </div>
      )}

      {positions.__me && (
        <div
          className="absolute w-6 h-6 flex items-center justify-center z-10 pointer-events-none"
          style={{ left: `${positions.__me.x}%`, top: `${positions.__me.y}%`, transform: "translate(-50%,-50%)" }}
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400/50 animate-ping" />
          <span className="relative w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-white dark:border-ink-900 shadow" />
        </div>
      )}

      {pins.map((pin, i) => {
        const key = pin.id ?? i;
        const pos = positions[key];
        if (!pos) return null;

        const isActive = active === key;
        const openLeft = pos.x > 62;
        const openTop = pos.y < 30;

        return (
          <button
            key={key}
            onMouseEnter={() => setActive(key)}
            onMouseLeave={() => setActive(null)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group z-10"
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              className="relative flex items-center justify-center shadow-lg"
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 dark:border-ink-900 ${pin.color === "red" ? "bg-danger-500" : "bg-brand-500"
                  }`}
                style={{
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                }}
              />
              <span
                className="absolute text-white text-xs font-bold"
                style={{
                  marginLeft: "1px",
                  marginTop: "-2px",
                }}
              >
                {pin.label ?? i + 1}
              </span>
            </motion.div>
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
                    <div
                      key={idx}
                      onClick={item.onClick}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-[#171717] rounded-lg ${item.onClick ? "cursor-pointer" : ""}`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-ink-900 dark:text-white flex items-center gap-1">
                          {item.name}
                          {item.verified !== false && <span className="text-brand-500">✓</span>}
                        </p>
                        <p className="text-[11px] text-ink-400">{item.company}</p>
                      </div>
                      {item.rating != null && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star1 key={s} size={11} variant="Bold" className={s <= item.rating ? "text-amber-400" : "text-ink-200 dark:text-ink-700"} />
                          ))}
                        </div>
                      )}
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

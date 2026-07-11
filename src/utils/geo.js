// Geolocation only works on secure origins (https, or http://localhost) —
// on a plain http:// LAN address the browser rejects it instantly with a
// PERMISSION_DENIED-like error before any prompt even shows, which looks
// identical to the user actually denying access. Surface that distinction
// (and TIMEOUT/POSITION_UNAVAILABLE) via `reason` so the UI can explain what
// actually happened instead of one generic message for every case.
export function getCurrentCoords() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      return resolve({ coords: null, reason: "insecure_context" });
    }
    if (!navigator.geolocation) {
      return resolve({ coords: null, reason: "unsupported" });
    }
    const attempt = (options) =>
      new Promise((res) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => res({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, reason: null }),
          (err) => res({ coords: null, reason: err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable" }),
          options
        );
      });

    attempt({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }).then((first) => {
      // Desktops/laptops without a GPS chip often time out or fail on a
      // high-accuracy fix — retry once with network-based positioning
      // before giving up, instead of surfacing a failure that a plain retry
      // would have avoided.
      if (first.coords || first.reason === "denied") return resolve(first);
      attempt({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }).then(resolve);
    });
  });
}

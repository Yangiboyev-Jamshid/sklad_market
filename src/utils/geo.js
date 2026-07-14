// Turns a typed address/city into lat/lng via OpenStreetMap's free Nominatim
// geocoder — no device location permission needed. Best-effort: returns null
// coords on any failure so the caller can fall back or ask the user to retry.
export async function geocodeAddress(query) {
  if (!query?.trim()) return { coords: null, reason: "empty" };
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { coords: null, reason: "unavailable" };
    const results = await res.json();
    const first = results?.[0];
    if (!first) return { coords: null, reason: "not_found" };
    return { coords: { lat: Number(first.lat), lng: Number(first.lon) }, reason: null };
  } catch {
    return { coords: null, reason: "unavailable" };
  }
}

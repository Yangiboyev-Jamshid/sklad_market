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

export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { address: null, reason: "unavailable" };
    const result = await res.json();
    if (!result?.display_name) return { address: null, reason: "not_found" };
    return { address: result.display_name, reason: null };
  } catch {
    return { address: null, reason: "unavailable" };
  }
}

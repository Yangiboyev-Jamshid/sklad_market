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

export async function reverseGeocode(lat, lng, { lang } = {}) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1${
      lang ? `&accept-language=${encodeURIComponent(lang)}` : ""
    }`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return { address: null, city: null, reason: "unavailable" };
    const result = await res.json();
    if (!result?.display_name) return { address: null, city: null, reason: "not_found" };
    const a = result.address || {};
    // Prefer the most city-like admin level; Nominatim's field naming varies
    // by locale/country, so fall back down to broader regions if needed.
    const city =
      a.city || a.town || a.municipality || a.village || a.county || a.state_district || a.state || null;
    return { address: result.display_name, city, reason: null };
  } catch {
    return { address: null, city: null, reason: "unavailable" };
  }
}

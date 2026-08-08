const YANDEX_SUGGEST_API_KEY = import.meta.env.VITE_YANDEX_SUGGEST_API_KEY;

export async function suggestAddress(query, { signal } = {}) {
  const text = query?.trim();
  if (!text || !YANDEX_SUGGEST_API_KEY) return [];
  try {
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_SUGGEST_API_KEY}&text=${encodeURIComponent(
      text
    )}&lang=ru_RU&types=geo&print_address=1&bbox=55.9,37.1~73.2,45.6`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results || [])
      .map((r) => ({
        title: r.title?.text ?? "",
        subtitle: r.subtitle?.text ?? "",
        address: [r.title?.text, r.subtitle?.text].filter(Boolean).join(", "),
      }))
      .filter((r) => r.address);
  } catch {
    return [];
  }
}

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
    const city =
      a.city || a.town || a.municipality || a.village || a.county || a.state_district || a.state || null;
    return { address: result.display_name, city, reason: null };
  } catch {
    return { address: null, city: null, reason: "unavailable" };
  }
}

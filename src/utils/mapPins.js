
function groupPinsByLocation(items, getLat, getLng) {
  const groups = new Map();
  items.forEach((item) => {
    const lat = getLat(item);
    const lng = getLng(item);
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, { lat, lng, items: [] });
    groups.get(key).items.push(item);
  });
  return Array.from(groups.values());
}

export function buildProductMapPins(items, navigate) {
  const groups = groupPinsByLocation(items, (i) => i.lat, (i) => i.lng);
  return groups.map((group, i) => ({
    id: i,
    lat: group.lat,
    lng: group.lng,
    color: i % 2 === 0 ? "red" : "purple",
    label: group.items.length,
    popover: group.items.slice(0, 6).map((item) => ({
      name: item.productName ?? item.name ?? "Товар",
      company: item.companyName ?? "",
      rating: item.rating,
      verified: item.verified,
      onClick: item.slug
        ? () => navigate(`/product/${item.slug}`)
        : item.productId
          ? () => navigate(`/product/${item.productId}`)
          : undefined,
    })),
  }));
}

export function buildCompanyMapPins(items, navigate) {
  const groups = groupPinsByLocation(items, (c) => c.lat, (c) => c.lng);
  return groups.map((group, i) => ({
    id: i,
    lat: group.lat,
    lng: group.lng,
    color: "blue",
    label: group.items.length,
    popover: group.items.slice(0, 6).map((c) => ({
      name: c.companyName,
      company: c.companyAddress,
      verified: c.verificationStatus === "VERIFIED",
      onClick: () => navigate(`/company/${c.slug}`),
    })),
  }));
}

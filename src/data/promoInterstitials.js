// Interstitial promo campaigns shown periodically on specific pages.
// There is no backend/admin console for this yet — entries are configured
// here directly. Add a campaign by pushing an object matching this shape:
//
// {
//   id: "unique-campaign-id",
//   active: true,
//   targetPages: ["home", "catalog", "companies", "product", "profile"],
//   imageUrl: "https://.../banner.jpg",
//   title: "Short headline",
//   description: "One or two sentences about the offer.",
//   ctaLabel: "View product",
//   ctaHref: "/product/some-slug",
//   startDate: "2026-01-01",
//   endDate: "2026-12-31",
//   maxShowsPerUser: 3,
//   cooldownHours: 24,
// }

export const promoInterstitials = [];

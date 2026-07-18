import { getPublicCompanies } from "../api/api";

let publicExtrasPromise = null;

// getCompanyBySlug's detail response doesn't reliably include logoUrl/companyCreatedDate,
// so callers that need those fields fall back to the paginated public list (which does).
export function getPublicCompanyExtras() {
  if (!publicExtrasPromise) {
    publicExtrasPromise = getPublicCompanies({ page: 1, per_page: 100 })
      .then((data) => {
        const map = new Map();
        (data?.content ?? []).forEach((c) => {
          map.set(c.id, { logoUrl: c.logoUrl ?? null, companyCreatedDate: c.companyCreatedDate ?? null });
        });
        return map;
      })
      .catch(() => new Map());
  }
  return publicExtrasPromise;
}

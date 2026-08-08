import { getPublicCompanies } from "../api/api";

let publicExtrasPromise = null;

export function getPublicCompanyExtras() {
  if (!publicExtrasPromise) {
    publicExtrasPromise = getPublicCompanies({ page: 1, per_page: 100 })
      .then((data) => {
        const map = new Map();
        (data?.content ?? []).forEach((c) => {
          map.set(c.id, { name: c.name ?? null, logoUrl: c.logoUrl ?? null, companyCreatedDate: c.companyCreatedDate ?? null });
        });
        return map;
      })
      .catch(() => new Map());
  }
  return publicExtrasPromise;
}

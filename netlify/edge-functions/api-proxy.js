// Proxies /api/* to the real backend, overriding Origin/Referer so requests
// look like they come from https://skladmarket.uz — the backend's CORS
// filter rejects any other Origin with 403 "Invalid CORS request" (surfaced
// to users as "Доступ запрещён..."), which is what happened when the plain
// netlify.toml redirect forwarded the deployed site's own Origin header.
const BACKEND_ORIGIN = "https://skladmarket.uz";

export default async (request) => {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, BACKEND_ORIGIN);

  const headers = new Headers(request.headers);
  headers.set("Origin", BACKEND_ORIGIN);
  headers.set("Referer", `${BACKEND_ORIGIN}/`);
  headers.delete("host");

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });

  return response;
};

export const config = { path: "/api/*" };

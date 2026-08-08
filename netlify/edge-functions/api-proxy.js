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

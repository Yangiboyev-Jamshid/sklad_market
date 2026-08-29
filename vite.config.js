import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_ORIGIN = "https://skladmarket.uz";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true,
        // The backend's CORS filter only accepts Origin: https://skladmarket.uz and
        // rejects everything else with 403 "Invalid CORS request" — mirror the same
        // Origin/Referer rewrite the Netlify edge function (api-proxy.js) does in prod,
        // so the dev server doesn't forward the browser's real localhost Origin.
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", BACKEND_ORIGIN);
            proxyReq.setHeader("Referer", `${BACKEND_ORIGIN}/`);
          });
        },
      },
    },
  },
});

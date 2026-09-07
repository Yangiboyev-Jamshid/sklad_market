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

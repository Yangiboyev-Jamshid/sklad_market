import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default is unchanged (the shared backend). Set VITE_API_PROXY_TARGET in .env.local to point
  // the dev proxy at a locally running gateway instead.
  const target = env.VITE_API_PROXY_TARGET || "https://skladmarket.uz";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: !target.startsWith("http://"),
        },
      },
    },
  };
});

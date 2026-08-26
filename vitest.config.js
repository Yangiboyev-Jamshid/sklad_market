import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/ai/**/__tests__/**/*.{test,spec}.{js,jsx}"],
    setupFiles: ["src/ai/__tests__/setup.js"],
    css: false,
  },
});

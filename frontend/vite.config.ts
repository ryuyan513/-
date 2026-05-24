import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages のときは /<repo-name>/ をベースパスにする
const base = process.env.GITHUB_PAGES === "true" ? "/-/" : "/";

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
  },
});

import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * GitHub Pages 不支持 SPA 路由重写，直接访问 /orders 这类子路径会返回 404。
 * 生成一份 404.html（内容与 index.html 相同）即可让前端路由接管。
 * Vercel 有 vercel.json 的 rewrite 兜底，多这个文件也无害。
 */
function spaNotFoundFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    apply: "build",
    closeBundle() {
      const dist = resolve(process.cwd(), "dist");
      const index = resolve(dist, "index.html");
      if (existsSync(index)) {
        copyFileSync(index, resolve(dist, "404.html"));
      }
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss(), spaNotFoundFallback()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  build: {
    emptyOutDir: false,
  },
});

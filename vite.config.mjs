import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from the project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    root: ".",
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ["@shopify/shop-minis-react"],
    },
    server: {
      proxy: {
        "/api": {
          target: "https://fal.ai",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              proxyReq.setHeader("Authorization", `Key ${env.FAL_KEY}`);
              if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader("Content-Type", "application/json");
                proxyReq.setHeader(
                  "Content-Length",
                  Buffer.byteLength(bodyData)
                );
                proxyReq.write(bodyData);
              }
            });
          },
        },
      },
    },
  };
});

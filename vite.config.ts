import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const proxyTarget =
    process.env.VITE_PROXY_TARGET ||
    process.env.VITE_API_URL ||
    `http://localhost:${process.env.BACKEND_PORT || 8081}`;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});

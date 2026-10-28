import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  cacheDir: ".vite-isolated",
  publicDir: 'public',
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: [],
    noDiscovery: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});

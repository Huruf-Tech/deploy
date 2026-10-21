import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "./www",
  },
  // server: {
  //   https: true,
  //   port:5173
  // },
  plugins: [
    react(),
    tailwindcss(),
    // mkcert(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/new/",
  plugins: [react(), tailwindcss()],
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths make the build work on GitHub Pages project sites.
  base: "./",
  plugins: [react()]
});

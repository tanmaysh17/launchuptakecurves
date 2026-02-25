import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // GitHub Pages project-site base path for tanmaysh17/launchuptakecurves.
  base: "/launchuptakecurves/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        persistency: resolve(__dirname, "persistency.html")
      }
    }
  }
});

import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "rgb(var(--app-bg) / <alpha-value>)",
          surface: "rgb(var(--app-surface) / <alpha-value>)",
          elevated: "rgb(var(--app-elevated) / <alpha-value>)",
          accent: "rgb(var(--app-accent) / <alpha-value>)",
          amber: "rgb(var(--app-amber) / <alpha-value>)",
          purple: "rgb(var(--app-purple) / <alpha-value>)",
          text: "rgb(var(--app-text) / <alpha-value>)",
          muted: "rgb(var(--app-muted) / <alpha-value>)",
          border: "rgb(var(--app-border) / <alpha-value>)",
          success: "rgb(var(--app-success) / <alpha-value>)"
        }
      },
      borderRadius: {
        panel: "8px"
      },
      fontFamily: {
        chrome: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"]
      },
      keyframes: {
        pulseDot: {
          "0%,100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        pulseDot: "pulseDot 1.5s ease-in-out infinite",
        fadeUp: "fadeUp 0.35s ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;

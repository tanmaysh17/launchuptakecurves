import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0d1117",
          surface: "#161b22",
          elevated: "#1a2332",
          accent: "#00d4b4",
          amber: "#f0a500",
          purple: "#a78bfa",
          text: "#e6edf3",
          muted: "#8b949e",
          border: "#30363d",
          success: "#3fb950"
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

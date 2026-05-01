import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "#050508",
        "app-2": "#080810",
        gold: "#FFB800",
        "gold-muted": "#CC9200",
        "gold-dim": "rgba(255,184,0,0.12)",
        violet: "#8B5CF6",
        "violet-muted": "#7C3AED",
        "violet-dim": "rgba(139,92,246,0.12)",
        surface: "rgba(255,255,255,0.04)",
        "surface-1": "rgba(255,255,255,0.04)",
        "surface-2": "rgba(255,255,255,0.07)",
        "surface-3": "rgba(255,255,255,0.11)",
        "surface-hover": "rgba(255,255,255,0.07)",
        border: "rgba(255,255,255,0.08)",
        "border-dim": "rgba(255,255,255,0.06)",
        "border-mid": "rgba(255,255,255,0.10)",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
      },
      backdropFilter: {
        glass: "blur(12px)",
      },
      backgroundColor: {
        glass: "rgba(255,255,255,0.04)",
      },
      borderColor: {
        glass: "rgba(255,255,255,0.08)",
      },
      maxWidth: {
        "8xl": "96rem",
      },
      keyframes: {
        "orb-drift": {
          "0%,100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "orb-drift": "orb-drift 10s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease forwards",
        "slide-right": "slide-right 0.4s ease forwards",
        "scale-in": "scale-in 0.3s ease forwards",
      },
    },
  },
  plugins: [],
}
export default config

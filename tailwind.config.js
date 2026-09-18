/** @type {import('tailwindcss').Config} */
// ZYRQUEN Ω∞ Sovereign Kernel - Tailwind Config v4.1.14
// Grounded in LOCKED_FROZEN_v1.2_LTS | SSoT Δ0 | Genesis #849202

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,css}",
  ],
  theme: {
    extend: {
      colors: {
        sovereign: {
          gold: "#D4AF37",
          dark: "#070a12",
          panel: "#0a0f1e",
          border: "#17233f",
          success: "#10B981",
          fail: "#EF4444",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
        prompt: ["Prompt", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}

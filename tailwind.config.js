/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zq: {
          dark: '#070a12',
          surface: '#0a0f1e',
          gold: '#D4AF37',
          cyan: '#06B6D4',
          border: '#17233f',
          green: '#10B981',
          crimson: '#EF4444'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}

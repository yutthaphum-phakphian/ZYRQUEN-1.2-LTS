import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// 🏛️ Sovereign Console SSoT Anchor
// Genesis Block: #849202
// Merkle Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
// Seals Δ0: 14,902

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        includeAssets: ['favicon.ico', 'icon.svg'],
        name: 'ZYRQUEN Ω - Sovereign World Engine',
        short_name: 'ZYRQUEN',
        description:
          'Sovereign Operating System & Civilization Intelligence Control Plane - Block #849202',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: 'CYBERGEN-1-L175',
        scope: 'CYBERGEN-1-L175',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('jspdf')) return 'pdf';
            return 'vendor';
          }
        },
      },
    },
  },
  define: {
    'process.env.ZYRQUEN_BLOCK_HEIGHT': '"849202"',
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// ZYRQUEN Ω∞ Sovereign Kernel v1.2 LTS — Vite Configuration
// Block Anchor: #849202 | Genesis Merkle Root: 0x909ab814...43fa4c68
// SHA-256 Digest: 4c53a5422dc19d557cfe47b81ac43fc156d768b64ddcdfa82d9169fad03614ab

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'ZYRQUEN Ω∞ Sovereign World Engine',
        short_name: 'ZYRQUEN',
        description: 'Sovereign Operating System & Civilization Intelligence Control Plane - Block #849202 (Frozen v1.2 LTS)',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
      },
      devOptions: {
        enabled: true,
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
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          graphics: ['three'],
          lucide: ['lucide-react'],
          pdf: ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
  define: {
    'process.env.ZYRQUEN_BLOCK_HEIGHT': '849202',
    'process.env.ZYRQUEN_MERKLE_ROOT': '"909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68"',
  },
});

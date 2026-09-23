import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/ZYRQUEN-1.2-LTS/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // แก้จาก false -> auto
      selfDestroying: false, // เปิดเป็น true แค่ครั้งเดียวเพื่อล้าง cache ขาว แล้วค่อยเปลี่ยนกลับเป็น false
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/ZYRQUEN-1.2-LTS/',
        name: 'ZYRQUEN Ω∞ Sovereign World Engine',
        short_name: 'ZYRQUEN',
        description: 'Sovereign Operating System & Civilization Intelligence Control Plane - Block #849202',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/ZYRQUEN-1.2-LTS/',
        scope: '/ZYRQUEN-1.2-LTS/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    dedupe: ['react', 'react-dom'],
  },
  server: { port: 3000, host: true },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2500,
  },
  define: {
    'process.env.ZYRQUEN_BLOCK_HEIGHT': '849202',
  },
});

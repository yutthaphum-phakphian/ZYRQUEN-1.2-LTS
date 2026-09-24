import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // 1. ตั้งค่า Base Path สำหรับ GitHub Pages (ใช้ './' เพื่อให้โหลด Relative Path ได้ทันที)
    base: process.env.GITHUB_PAGES === 'true' ? './' : '/',

    // 2. ปลั๊กอินตามที่ระบุใน package.json (React + Tailwind v4 + PWA)
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'ZYRQUEN Ω∞ Control Center',
          short_name: 'ZYRQUEN',
          description: 'Cloud & AI Operations Control Center',
          theme_color: '#0f172a',
          background_color: '#020617',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],

    // 3. ตั้งค่า Path Alias (@/ -> src/)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 4. การจัดการ Build Output
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            three: ['three'],
            charts: ['recharts', 'd3'],
          },
        },
      },
    },

    // 5. พอร์ตสำหรับ Dev Server
    server: {
      port: 5173,
      host: true,
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Determine Base Path for GitHub Pages, Cloud Run, or local dev
  let rawBase = process.env.VITE_BASE_PATH || process.env.BASE_PATH || '';
  if (!rawBase && process.env.GITHUB_REPOSITORY) {
    const repoParts = process.env.GITHUB_REPOSITORY.split('/');
    if (repoParts.length > 1 && !repoParts[1].endsWith('.github.io')) {
      rawBase = `/${repoParts[1]}/`;
    }
  }
  const basePath = rawBase
    ? rawBase.startsWith('/')
      ? (rawBase.endsWith('/') ? rawBase : `${rawBase}/`)
      : `/${rawBase.endsWith('/') ? rawBase : `${rawBase}/`}`
    : '/';

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: basePath,
          name: 'ZYRQUEN Ω∞ Sovereign World Engine',
          short_name: 'ZYRQUEN Ω∞',
          description: 'Sovereign Operating System & Civilization Intelligence Control Plane - Block #849202 (Frozen v1.2 LTS)',
          theme_color: '#070a12',
          background_color: '#070a12',
          display: 'standalone',
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: 'icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json,pdf,md,txt}'],
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
          runtimeCaching: [
            {
              // Offline-first caching strategy for verification_json directory and associated forensic artifacts
              urlPattern: ({ url }) =>
                url.pathname.includes('/verification_json/') ||
                url.pathname.includes('verification_json') ||
                url.pathname.endsWith('.pdf') ||
                url.pathname.includes('DOC-SOV-HSM-1010-2026'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'zyrquen-verification-json-cache-v1',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year offline preservation
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Offline-first caching strategy for docs directory and court-admissible specifications
              urlPattern: ({ url }) =>
                url.pathname.includes('/docs/') ||
                url.pathname.includes('docs') ||
                url.pathname.endsWith('.md') ||
                url.pathname.includes('audit_trail_api'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'zyrquen-docs-evidence-cache-v1',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year offline preservation
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache-first strategy for static resources, fonts and icons
              urlPattern: ({ request }) =>
                request.destination === 'style' ||
                request.destination === 'script' ||
                request.destination === 'worker' ||
                request.destination === 'font' ||
                request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'zyrquen-static-assets-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as any as true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

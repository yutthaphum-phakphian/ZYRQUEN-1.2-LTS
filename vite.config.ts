import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react()],
  base: './',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: false,
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode !== 'production',
    target: 'es2022',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
  },

  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'coverage', 'tests/unit/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
}));

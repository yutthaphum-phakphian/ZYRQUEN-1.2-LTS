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
    port: 3000,
    strictPort: false,
    open: false,
    allowedHosts: true,
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
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts', 'd3'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-three': ['three'],
          'vendor-motion': ['motion'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ZYRQUEN Ω∞ Sovereign Kernel v1.2 LTS — Vite Configuration
// Block Anchor: #849202 | Genesis Merkle Root: 0x909ab814...43fa4c68
// SHA-256 Digest: 4c53a5422dc19d557cfe47b81ac43fc156d768b64ddcdfa82d9169fad03614ab

export default defineConfig({
  plugins: [react()],
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          graphics: ['three'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
  define: {
    'process.env.ZYRQUEN_BLOCK_HEIGHT': '849202',
    'process.env.ZYRQUEN_MERKLE_ROOT': '"909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68"',
  },
});

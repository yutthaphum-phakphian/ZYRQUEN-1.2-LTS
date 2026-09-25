import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // กำหนด Relative path เพื่อให้ GitHub Pages โหลด Asset ได้ถูกต้อง
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/unit/**'],
  },
});

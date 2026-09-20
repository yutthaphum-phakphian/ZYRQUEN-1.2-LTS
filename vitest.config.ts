import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/*.test.ts', 'tests/*.test.tsx'],
    exclude: ['tests/unit/**', 'node_modules/**'],
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

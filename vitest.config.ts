import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'tests/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'tests/unit/**',
    ],
    css: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    setupFiles: [],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
      ],
      lines: 50,
      functions: 50,
      branches: 50,
      statements: 50,
    },
  },
});

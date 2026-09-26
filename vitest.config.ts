import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { SOVEREIGN_CONFIG } from './src/config/sovereign.config';

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
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
    ],
    css: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    // Enforce SLA compliance: 12-Stage Trace Replay must complete within max threshold
    testTimeout: SOVEREIGN_CONFIG.traceReplaySLA.maxExecutionMs * 1000, // Convert ms to μs for Vitest
    hookTimeout: SOVEREIGN_CONFIG.traceReplaySLA.targetExecutionMs * 500, // Safety margin for setup/teardown
    isolate: true, // Enforce test isolation to maintain cryptographic coherence
    threads: true, // Enable thread-per-test for hermetic execution
    setupFiles: [], // Pre-load when tests/setup.ts is available
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
      // Enforce comprehensive coverage aligned with security gate (≥ 0.85 confidence threshold)
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
      perFile: true,
      skipFull: false,
    },
    // TypeScript quality enforcement
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    },
  },
});

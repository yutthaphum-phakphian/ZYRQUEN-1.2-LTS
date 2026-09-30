import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react()],
  base: './',

  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'lucide-react',
      'motion',
      'motion/react',
      'recharts',
      'd3',
      'three',
      'jspdf',
      'jspdf-autotable',
      'qrcode',
      'qrcode.react',
      'jsqr',
      'jszip',
      'html2canvas',
      'clsx',
      'tailwind-merge',
      'socket.io-client',
    ],
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
      reporter: ['text', 'text-summary'],
      include: [
        'src/adapters/**/*.{ts,tsx}',
        'src/store/**/*.{ts,tsx}',
        'src/config/**/*.{ts,tsx}',
        'src/core/**/*.{ts,tsx}',
        'src/services/broadcastSyncService.ts',
        'src/utils/p0FrozenCoreGuard.ts',
        'src/utils/telemetry.ts',
        'src/utils/telemetrySnapshot.ts',
        'src/utils/alertEngine.ts',
        'src/utils/toast.ts',
        'src/utils/vibration.ts',
        'src/utils/clipboard.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
        'src/data/**',
        'src/components/forensics/**',
        'src/utils/*Pdf*.ts',
        'src/utils/*Export*.ts',
        'src/utils/forensic*.ts',
        'src/utils/court*.ts',
        'src/utils/evidence*.ts',
        'src/utils/masterForensicAuditPackage.ts',
        'src/utils/p1QuarantineLayer.ts',
        'src/utils/p2ForensicEngine.ts',
        'src/utils/p3ArtifactEngine.ts',
        'src/utils/phase21_30Engine.ts',
        'src/utils/phase31_40Engine.ts',
        'src/services/CourtEvidenceDossierGenerator.ts',
        'src/services/EvidenceExportService.ts',
        'src/services/LegalPrintAutomation.ts',
      ],
    },
  },
}));

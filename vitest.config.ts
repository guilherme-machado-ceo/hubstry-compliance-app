import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const templateRoot = path.resolve(import.meta.dirname)

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      '@': path.resolve(templateRoot, 'client', 'src'),
      '@/app': path.resolve(templateRoot, 'app'),
      '@/components': path.resolve(templateRoot, 'components'),
      '@/lib': path.resolve(templateRoot, 'lib'),
      '@/hooks': path.resolve(templateRoot, 'hooks'),
      '@/types': path.resolve(templateRoot, 'types'),
      '@/utils': path.resolve(templateRoot, 'utils'),
      '@/prisma': path.resolve(templateRoot, 'prisma'),
      '@shared': path.resolve(templateRoot, 'shared'),
    },
  },
  test: {
    // Ambiente de teste
    environment: 'jsdom',
    globals: true,

    // Setup
    setupFiles: ['./vitest.setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/**',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },

    // Include/Exclude
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],

    // Reporters
    reporters: ['verbose'],

    // Máximo de workers
    threads: true,
    isolate: true,
  },
})

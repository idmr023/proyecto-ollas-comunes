import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // Usar subprocesos fork en lugar de hilos de trabajo para evitar el cierre del pool de conexiones de pg
    setupFiles: ['./test/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**',
        'src/server.ts',
        'src/lib/generated/**',
      ],
    },
  },
})

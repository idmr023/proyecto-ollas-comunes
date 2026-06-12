import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // Usar subprocesos fork en lugar de hilos de trabajo para evitar el cierre del pool de conexiones de pg
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    maxWorkers: 1,
  },
})

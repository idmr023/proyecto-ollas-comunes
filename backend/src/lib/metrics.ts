import { cpuUsage, memoryUsage } from 'process'

let lastCpuUsage = cpuUsage()
let lastTime = Date.now()

/**
 * Inicia el registro periódico de métricas de rendimiento en consola (CPU, RAM y Event Loop delay)
 * con un intervalo dado en milisegundos.
 */
export function startPerformanceMonitoring(intervalMs: number = 5000): void {
  console.log(`[PERFORMANCE MONITOR] Iniciando monitoreo cada ${intervalMs / 1000}s...`)

  setInterval(() => {
    // 1. Calcular Event Loop Delay
    const start = Date.now()
    setImmediate(() => {
      const delay = Date.now() - start
      
      // 2. Calcular Uso de CPU
      const currentCpuUsage = cpuUsage()
      const currentTime = Date.now()
      const timeDiff = (currentTime - lastTime) * 1000 // Convertir a microsegundos
      
      const userCpuDiff = currentCpuUsage.user - lastCpuUsage.user
      const systemCpuDiff = currentCpuUsage.system - lastCpuUsage.system
      const totalCpuDiff = userCpuDiff + systemCpuDiff
      
      // % de CPU usado en este intervalo (proporcional al tiempo transcurrido)
      const cpuPercentage = ((totalCpuDiff / timeDiff) * 100).toFixed(2)
      
      lastCpuUsage = currentCpuUsage
      lastTime = currentTime
      
      // 3. Calcular Uso de RAM (Heap)
      const mem = memoryUsage()
      const heapUsedMb = (mem.heapUsed / 1024 / 1024).toFixed(2)
      const rssMb = (mem.rss / 1024 / 1024).toFixed(2)

      console.info(
        `[PERFORMANCE METRICS] CPU: ${cpuPercentage}% | Heap RAM: ${heapUsedMb} MB | RSS RAM: ${rssMb} MB | Event Loop Delay: ${delay} ms`
      )
    })
  }, intervalMs)
}

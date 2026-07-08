const MAX_RETRIES = 3
const BASE_DELAY = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class CircuitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CircuitError'
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    baseDelay?: number
    onRetry?: (attempt: number, error: unknown) => void
  },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? MAX_RETRIES
  const baseDelay = options?.baseDelay ?? BASE_DELAY

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      options?.onRetry?.(attempt, error)
      await sleep(baseDelay * Math.pow(2, attempt - 1))
    }
  }

  throw new CircuitError('Retry exhausted')
}

const circuitState = new Map<string, { failures: number; lastFailure: number; open: boolean }>()
const THRESHOLD = 3
const RESET_TIMEOUT = 30_000

export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const state = circuitState.get(key) ?? { failures: 0, lastFailure: 0, open: false }

  if (state.open) {
    if (Date.now() - state.lastFailure > RESET_TIMEOUT) {
      state.open = false
      state.failures = 0
    } else {
      throw new CircuitError(`Circuit open for ${key}`)
    }
  }

  try {
    const result = await fn()
    state.failures = 0
    state.open = false
    return result
  } catch (error) {
    state.failures++
    state.lastFailure = Date.now()
    if (state.failures >= THRESHOLD) state.open = true
    circuitState.set(key, state)
    throw error
  }
}

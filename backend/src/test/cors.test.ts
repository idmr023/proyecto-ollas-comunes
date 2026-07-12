import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveAllowedOrigins } from '../lib/cors'

describe('resolveAllowedOrigins', () => {
  const ORIGINAL_ENV = process.env.ALLOWED_ORIGINS

  beforeEach(() => {
    delete process.env.ALLOWED_ORIGINS
  })

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.ALLOWED_ORIGINS
    } else {
      process.env.ALLOWED_ORIGINS = ORIGINAL_ENV
    }
  })

  it('returns the env value as a trimmed array when ALLOWED_ORIGINS is set', () => {
    process.env.ALLOWED_ORIGINS = 'https://a.com , https://b.com,https://c.com'
    const result = resolveAllowedOrigins(false)
    expect(result).toEqual(['https://a.com', 'https://b.com', 'https://c.com'])
  })

  it('filters out empty segments from the env value', () => {
    process.env.ALLOWED_ORIGINS = 'https://a.com,,  ,https://b.com'
    const result = resolveAllowedOrigins(false)
    expect(result).toEqual(['https://a.com', 'https://b.com'])
  })

  it('returns an empty array in production when ALLOWED_ORIGINS is not set (fail-secure)', () => {
    const result = resolveAllowedOrigins(true)
    expect(result).toEqual([])
  })

  it('returns the dev default origins when not in production and ALLOWED_ORIGINS is not set', () => {
    const result = resolveAllowedOrigins(false)
    expect(result).toContain('http://localhost:3000')
    expect(result).toContain('http://127.0.0.1:3000')
    expect(result).toContain('http://localhost:5173')
    expect(result).toContain('http://127.0.0.1:5173')
  })

  it('prefers the env value over the dev defaults', () => {
    process.env.ALLOWED_ORIGINS = 'https://only-this.com'
    const result = resolveAllowedOrigins(false)
    expect(result).toEqual(['https://only-this.com'])
  })
})

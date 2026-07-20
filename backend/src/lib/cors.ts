export const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function resolveAllowedOrigins(isProduction: boolean): string[] {
  const raw = process.env.ALLOWED_ORIGINS
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (isProduction) return []
  return DEFAULT_DEV_ORIGINS
}

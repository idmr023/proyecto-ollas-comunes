import 'dotenv/config'

process.env.JWT_SECRET = 'unit-test-secret'
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'unit-test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'unit-test-service-role-key'
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está configurada en el entorno.')
}
process.env.EMAIL_USER = process.env.EMAIL_USER ?? 'unit-test@example.com'
process.env.EMAIL_PASS = process.env.EMAIL_PASS ?? 'unit-test-pass'
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000'

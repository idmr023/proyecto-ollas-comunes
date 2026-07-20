import 'dotenv/config'

// >= 32 caracteres: config/secrets.ts rechaza secretos debiles al arrancar.
process.env.JWT_SECRET = 'unit-test-secret-0123456789abcdef'
// Fijada explicitamente al sha256 del antiguo 'unit-test-secret' para que el
// material de cifrado de los tests no cambie al alargar JWT_SECRET.
process.env.DB_ENCRYPTION_KEY =
  '59585229db4db154e4c1c81a32379464b0fead7f0062dffbb55aa64d7647f48b'
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

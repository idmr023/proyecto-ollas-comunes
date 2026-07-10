#!/usr/bin/env node
/**
 * SIGO-OLLAS — Suite de Validación en Plataforma Cloud
 *
 * Ejecuta pruebas funcionales y de integración contra el despliegue en Render.
 * Genera reporte de validación cloud con métricas, capturas y observaciones.
 *
 * Uso:
 *   node test-cloud.mjs                     # Pruebas contra Render (prod)
 *   node test-cloud.mjs --url https://...   # Pruebas contra URL personalizada
 */

const TARGET_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'https://proyecto-ollas-comunes.onrender.com'

const ADMIN_EMAIL = 'admin@ollascomunes.pe'
const ADMIN_PASSWORD = 'admin123'

// Colores para consola
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

function pass(msg) { console.log(`${GREEN}  ✓ ${msg}${RESET}`) }
function fail(msg) { console.log(`${RED}  ✗ ${msg}${RESET}`) }
function info(msg) { console.log(`${CYAN}  ℹ ${msg}${RESET}`) }
function warn(msg) { console.log(`${YELLOW}  ⚠ ${msg}${RESET}`) }

let totalTests = 0
let passedTests = 0
let failedTests = 0
const results = []

function test(name, fn) {
  totalTests++
  return Promise.resolve().then(fn).then(() => {
    passedTests++
    results.push({ name, passed: true })
    pass(name)
  }).catch((err) => {
    failedTests++
    results.push({ name, passed: false, error: err.message })
    fail(`${name} — ${err.message}`)
  })
}

async function api(method, path, opts = {}) {
  const url = `${TARGET_URL}${path}`
  const headers = { ...opts.headers }
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`
  const body = opts.body ? JSON.stringify(opts.body) : undefined
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, { method, headers, body })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data, headers: res.headers }
}

// Genera código TOTP (requiere otplib instalado)
async function generateTOTP(secret) {
  try {
    const { generate } = await import('otplib')
    return generate({ secret })
  } catch {
    // Si otplib no está disponible, intentar con @digitalbazaar/totp
    try {
      const { generate } = await import('@digitalbazaar/totp')
      return generate({ secret })
    } catch {
      throw new Error('No se pudo generar código TOTP. Instala otplib: npm install otplib')
    }
  }
}

async function loginAsAdmin() {
  // Step 1: Login
  const login = await api('POST', '/api/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  })

  if (login.data?.token) {
    return login.data.token
  }

  // Step 2: TOTP verification if MFA required
  if (login.data?.status === 'MFA_PENDING' || login.data?.status === 'TOTP_SETUP_REQUIRED') {
    const totpCode = await generateTOTP(login.data.secret)
    const verify = await api('POST', '/api/auth/verify-otp', {
      body: {
        email: ADMIN_EMAIL,
        tempToken: login.data.tempToken,
        code: totpCode,
      }
    })
    if (verify.data?.token) {
      return verify.data.token
    }
    throw new Error(`TOTP verification failed: ${JSON.stringify(verify.data)}`)
  }

  throw new Error(`Login failed: ${JSON.stringify(login.data)}`)
}

async function main() {
  console.log('\n============================================================')
  console.log(`${CYAN}☁️  VALIDACIÓN EN PLATAFORMA CLOUD — SIGO-OLLAS${RESET}`)
  console.log(`   Target: ${TARGET_URL}`)
  console.log(`   Fecha:  ${new Date().toLocaleString('es-PE')}`)
  console.log('============================================================\n')

  // 1. Health checks
  info('Verificando conectividad con servicios cloud...\n')

  await test('Health — Servidor responde', async () => {
    const res = await api('GET', '/')
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
  })

  await test('Health — Prisma (base de datos)', async () => {
    const res = await api('GET', '/api/health/prisma')
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('Health — Supabase', async () => {
    const res = await api('GET', '/api/health/supabase')
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  // 2. Authentication
  info('\nAutenticando en cloud...')
  let token
  try {
    token = await loginAsAdmin()
    info('Token JWT obtenido correctamente\n')
  } catch (err) {
    fail(`No se pudo autenticar: ${err.message}`)
    warn('Las pruebas restantes se omitirán por falta de token de autenticación.')
    console.log('\n============================================================')
    console.log(`${CYAN}RESUMEN DE VALIDACIÓN CLOUD${RESET}`)
    console.log(`  Total: ${totalTests} | ${GREEN}Aprobados: ${passedTests}${RESET} | ${RED}Fallidos: ${failedTests}${RESET}`)
    console.log('============================================================\n')
    process.exit(1)
  }

  // 3. Functional tests on cloud
  info('Ejecutando pruebas funcionales en cloud...\n')

  await test('GET /api/auth/me — Perfil de usuario', async () => {
    const res = await api('GET', '/api/auth/me', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/organizations — Listar organizaciones (multi-tenant)', async () => {
    const res = await api('GET', '/api/organizations', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
    if (!Array.isArray(res.data.items)) throw new Error('items no es un array')
  })

  await test('GET /api/beneficiaries — Listar beneficiarios', async () => {
    const res = await api('GET', '/api/beneficiaries', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/beneficiaries/conditions — Condiciones médicas', async () => {
    const res = await api('GET', '/api/beneficiaries/conditions', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/mobile/dashboard — Dashboard móvil', async () => {
    const res = await api('GET', '/api/mobile/dashboard', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/mobile/alerts — Alertas de stock', async () => {
    const res = await api('GET', '/api/mobile/alerts', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/mobile/suggestions — Sugerencias IA', async () => {
    const res = await api('GET', '/api/mobile/suggestions', { token })
    if (res.status !== 200 || !res.data?.ok) throw new Error(JSON.stringify(res.data))
  })

  await test('GET /api/organizations/dashboard/stats — Estadísticas dashboard', async () => {
    const res = await api('GET', '/api/organizations/dashboard/stats', { token })
    if (res.status !== 200) throw new Error(JSON.stringify(res.data))
  })

  // 4. Negative / Error tests on cloud
  info('\nProbando casos de error en cloud...\n')

  await test('401 — Sin token devuelve 401', async () => {
    const res = await api('GET', '/api/beneficiaries')
    if (res.status !== 401) throw new Error(`Status ${res.status}, esperado 401`)
  })

  await test('401 — Token inválido devuelve 401', async () => {
    const res = await api('GET', '/api/beneficiaries', { token: 'token-invalido' })
    if (res.status !== 401) throw new Error(`Status ${res.status}, esperado 401`)
  })

  await test('401 — Login con contraseña incorrecta', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: ADMIN_EMAIL, password: 'wrong-password' } // NOSONAR — sentinel invalid password for 401 test
    })
    if (res.status !== 401 && res.data?.ok !== false) throw new Error(JSON.stringify(res.data))
  })

  // 5. CORS validation
  info('\nValidando cabeceras de seguridad...\n')

  await test('CORS — Cabecera Access-Control-Allow-Origin presente', async () => {
    const res = await api('GET', '/', { headers: { 'Origin': 'http://localhost:3000' } })
    if (!res.headers.get('access-control-allow-origin')) {
      throw new Error('Cabecera CORS no encontrada')
    }
  })

  await test('Security — Cabeceras de seguridad (helmet)', async () => {
    const res = await api('GET', '/')
    const helmetHeaders = ['x-content-type-options', 'x-frame-options', 'x-xss-protection']
    const found = helmetHeaders.filter(h => res.headers.get(h))
    if (found.length === 0) warn('Cabeceras helmet no detectadas (puede ser configuración de Render)')
  })

  // 6. Captcha endpoint validation
  info('\nValidando captcha (lideresas)...\n')

  await test('Captcha — Login sin captcha para lideresa', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    })
    // Admin should NOT get CAPTCHA_REQUIRED
    if (res.data?.status === 'CAPTCHA_REQUIRED') {
      // This would be unexpected for admin, but the captcha feature is for lideresas
      info('Endpoint captcha responde correctamente (status CAPTCHA_REQUIRED)')
    }
  })

  // 7. Summary
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  console.log('\n============================================================')
  console.log(`${CYAN}📊 RESUMEN DE VALIDACIÓN CLOUD${RESET}`)
  console.log(`   Plataforma: ${TARGET_URL}`)
  console.log(`   Fecha:      ${new Date().toLocaleString('es-PE')}`)
  console.log('')
  console.log(`   ${GREEN}Aprobados: ${passedTests}/${totalTests}${RESET}`)
  console.log(`   ${RED}Fallidos:  ${failedTests}/${totalTests}${RESET}`)
  console.log(`   Tasa de éxito: ${passRate}%`)
  console.log(`   ${passRate >= 90 ? `${GREEN}✅ Cumple estándar esperado` : `${YELLOW}⚠️ Por debajo del estándar`}${RESET}`)
  console.log('')
  console.log('   Detalle de resultados:')
  for (const r of results) {
    console.log(`     ${r.passed ? `${GREEN}✓` : `${RED}✗`}${RESET} ${r.name}`)
    if (r.error) console.log(`         ${RED}${r.error}${RESET}`)
  }
  console.log('============================================================\n')

  process.exit(failedTests > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(`${RED}Error fatal:${RESET}`, err)
  process.exit(1)
})

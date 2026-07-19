# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> SIGO-Ollas Offline-First PWA E2E Tests >> Test Offline: Registro offline con sincronización automática
- Location: e2e\offline.spec.ts:40:7

# Error details

```
Error: expect(received).not.toBeNull()

Received: null
```

# Test source

```ts
  1   | import './setup-env'
  2   | import { test, expect, type Page } from '@playwright/test'
  3   | import { generate } from 'otplib'
  4   | import { prisma } from '../../backend/src/lib/prisma'
  5   | 
  6   | const TEST_EMAIL = 'admin@ollascomunes.pe'
  7   | const TEST_PASSWORD = 'admin123'
  8   | 
  9   | async function loginAsAdmin(page: Page) {
  10  |   page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  11  |   page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))
  12  | 
  13  |   await page.goto('/login')
  14  |   await page.waitForLoadState('domcontentloaded')
  15  | 
  16  |   await page.fill('#login-email', TEST_EMAIL)
  17  |   await page.fill('#login-password', TEST_PASSWORD)
  18  |   await page.click('button[type="submit"]')
  19  | 
  20  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })
  21  | 
  22  |   const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  23  |   const secret = user?.totpSecret
  24  |   if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')
  25  | 
  26  |   const code = await generate({ secret })
  27  | 
  28  |   await page.fill('#otp-code', code)
  29  |   await page.click('button[type="submit"]')
  30  | 
  31  |   await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 45000 })
  32  | }
  33  | 
  34  | test.describe('SIGO-Ollas Offline-First PWA E2E Tests', () => {
  35  | 
  36  |   test.afterAll(async () => {
  37  |     await prisma.$disconnect()
  38  |   })
  39  | 
  40  |   test('Test Offline: Registro offline con sincronización automática', async ({ page, context }) => {
  41  |     // 1. Iniciar sesión online
  42  |     await loginAsAdmin(page)
  43  | 
  44  |     // 2. Navegar a beneficiarios para cargar la caché inicial
  45  |     await page.goto('/workspace/beneficiarios')
  46  |     await page.waitForLoadState('domcontentloaded')
  47  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  48  | 
  49  |     // 3. Simular desconexión completa (modo offline)
  50  |     await context.setOffline(true)
  51  |     await page.waitForTimeout(1000) // esperar propagación del evento offline
  52  | 
  53  |     // 4. Verificar que el banner offline esté presente
  54  |     await expect(page.locator('text=Sin conexión — Modo offline')).toBeVisible({ timeout: 35000 })
  55  | 
  56  |     // 5. Generar DNI aleatorio y registrar un beneficiario offline
  57  |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  58  |     await page.click('button:has-text("Registrar Beneficiario")')
  59  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  60  | 
  61  |     await page.fill('#beneficiary-firstName', 'OfflineTest')
  62  |     await page.fill('#beneficiary-lastName', 'Playwright')
  63  |     await page.fill('#beneficiary-dni', randomDni)
  64  |     await page.fill('#beneficiary-birthDate', '1995-08-25')
  65  | 
  66  |     // Seleccionar olla común (primer option después del placeholder)
  67  |     await page.selectOption('div.z-50 select', { index: 1 })
  68  | 
  69  |     // Confirmar registro (se guardará en la cola IndexedDB)
  70  |     await page.click('div.z-50 button:has-text("Registrar")')
  71  | 
  72  |     // El modal debería cerrarse e inyectar el cambio localmente
  73  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  74  | 
  75  |     // 6. Verificar que el banner ahora indica que hay un cambio guardado localmente
  76  |     await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 35000 })
  77  | 
  78  |     // 7. Simular reconexión de red (modo online)
  79  |     await context.setOffline(false)
  80  |     await page.waitForTimeout(4000) // esperar a que se active el trigger y ocurra la recarga automática
  81  | 
  82  |     // 8. El banner de sincronizando/offline debería desaparecer tras la recarga y la sincronización exitosa
  83  |     await expect(page.locator('text=Sin conexión — Modo offline')).not.toBeVisible({ timeout: 45000 })
  84  | 
  85  |     // 9. Verificar en la base de datos Postgres real que el beneficiario haya sido persistido por la sincronización
  86  |     const dbBeneficiary = await prisma.beneficiary.findUnique({
  87  |       where: { dni: randomDni }
  88  |     })
  89  | 
> 90  |     expect(dbBeneficiary).not.toBeNull()
      |                               ^ Error: expect(received).not.toBeNull()
  91  |     expect(dbBeneficiary?.firstName).toBe('OfflineTest')
  92  | 
  93  |     // Limpieza: eliminar el beneficiario de pruebas de la base de datos
  94  |     if (dbBeneficiary) {
  95  |       await prisma.beneficiary.delete({
  96  |         where: { id: dbBeneficiary.id }
  97  |       })
  98  |     }
  99  |   })
  100 | 
  101 |   test('Test Offline: Registro de ración offline con sincronización', async ({ page, context }) => {
  102 |     // 1. Crear un beneficiario de prueba en la base de datos para esta prueba
  103 |     const testDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  104 |     const tenant = await prisma.tenant.findFirst()
  105 |     if (!tenant) throw new Error('No hay tenants en base de datos para las pruebas')
  106 |     const firstOlla = await prisma.ollaComun.findFirst({
  107 |       where: { tenantId: tenant.id, status: 'active' },
  108 |       orderBy: { name: 'asc' }
  109 |     })
  110 |     if (!firstOlla) throw new Error('No hay ollas activas en base de datos para las pruebas')
  111 | 
  112 |     const b = await prisma.beneficiary.create({
  113 |       data: {
  114 |         firstName: 'RacionTest',
  115 |         lastName: 'Playwright',
  116 |         dni: testDni,
  117 |         birthDate: new Date('1990-01-01'),
  118 |         ollaId: firstOlla.id,
  119 |         tenantId: tenant.id
  120 |       }
  121 |     })
  122 | 
  123 |     // Asegurar que exista un plan de menú hoy para evitar el fallback del recomendador IA offline
  124 |     const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  125 |     const formatter = new Intl.DateTimeFormat('en-US', options)
  126 |     const parts = formatter.formatToParts(new Date())
  127 |     const year = parts.find(p => p.type === 'year')?.value
  128 |     const month = parts.find(p => p.type === 'month')?.value
  129 |     const day = parts.find(p => p.type === 'day')?.value
  130 |     const dateString = `${year}-${month}-${day}` // "YYYY-MM-DD"
  131 |     const operationDate = new Date(dateString)
  132 | 
  133 |     let menuPlan = await prisma.menuPlan.findFirst({
  134 |       where: {
  135 |         ollaId: firstOlla.id,
  136 |         operationDate
  137 |       }
  138 |     })
  139 |     if (!menuPlan) {
  140 |       menuPlan = await prisma.menuPlan.create({
  141 |         data: {
  142 |           ollaId: firstOlla.id,
  143 |           operationDate,
  144 |           dishName: 'Tallarines con salsa',
  145 |           plannedServings: 50,
  146 |           status: 'approved',
  147 |           suggestedByType: 'user',
  148 |           createdBy: (await prisma.appUser.findFirst())?.id
  149 |         }
  150 |       })
  151 |     }
  152 | 
  153 |     // 2. Iniciar sesión online
  154 |     await loginAsAdmin(page)
  155 | 
  156 |     // 3. Ir a la vista móvil del padrón para cargar la caché local
  157 |     await page.goto('/mobile/padron')
  158 |     await page.waitForLoadState('domcontentloaded')
  159 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  160 |     await page.waitForTimeout(2000) // permitir que IndexedDB guarde la caché de beneficiarios
  161 | 
  162 |     // 4. Simular desconexión
  163 |     await context.setOffline(true)
  164 |     await page.waitForTimeout(1000)
  165 | 
  166 |     // 5. Activar modo entrega e ingresar la entrega offline
  167 |     await page.click('button:has-text("Registrar Entrega de Ración")')
  168 |     await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 20000 })
  169 | 
  170 |     // Seleccionar nuestro beneficiario de prueba
  171 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', testDni)
  172 |     await page.waitForTimeout(500)
  173 |     await page.click(`text=${testDni}`) // hacer clic en la tarjeta
  174 | 
  175 |     // Confirmar entrega (esto encola la mutación offline e inyecta hasEatenToday = true)
  176 |     await page.click('button:has-text("Confirmar")')
  177 | 
  178 |     // Verificamos toast de éxito offline y redirección a inicio
  179 |     await expect(page).toHaveURL(/\/mobile\/inicio/, { timeout: 35000 })
  180 | 
  181 |     // 6. Simular reconexión
  182 |     await context.setOffline(false)
  183 |     await page.waitForTimeout(4000) // esperar sincronización y recarga automática
  184 | 
  185 |     // 7. Verificar en la base de datos Postgres real que se haya creado la entrega (MealDeliveryDetail)
  186 |     const deliveryDetail = await prisma.mealDeliveryDetail.findFirst({
  187 |       where: { beneficiaryId: b.id }
  188 |     })
  189 |     expect(deliveryDetail).not.toBeNull()
  190 | 
```
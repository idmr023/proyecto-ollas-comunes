# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> SIGO-Ollas Offline-First PWA E2E Tests >> Test Offline: Registro de ración offline con sincronización
- Location: e2e\offline.spec.ts:105:7

# Error details

```
Error: pollDb timed out after 30000ms
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
  34  | async function restoreNetworkAndFireOnlineEvent(page: Page, context: { setOffline: (v: boolean) => Promise<void> }) {
  35  |   await context.setOffline(false)
  36  |   await page.waitForFunction(() => navigator.onLine === true, { timeout: 10000 })
  37  |   await page.evaluate(() => window.dispatchEvent(new Event('online')))
  38  | }
  39  | 
  40  | async function pollDb<T>(
  41  |   fn: () => Promise<T | null>,
  42  |   { timeoutMs = 30_000, intervalMs = 1_000 } = {},
  43  | ): Promise<T> {
  44  |   const deadline = Date.now() + timeoutMs
  45  |   while (Date.now() < deadline) {
  46  |     const result = await fn().catch(() => null)
  47  |     if (result != null) return result
  48  |     await new Promise((r) => setTimeout(r, intervalMs))
  49  |   }
> 50  |   throw new Error(`pollDb timed out after ${timeoutMs}ms`)
      |         ^ Error: pollDb timed out after 30000ms
  51  | }
  52  | 
  53  | test.describe('SIGO-Ollas Offline-First PWA E2E Tests', () => {
  54  | 
  55  |   test.afterAll(async () => {
  56  |     await prisma.$disconnect()
  57  |   })
  58  | 
  59  |   test('Test Offline: Registro offline con sincronización automática', async ({ page, context }) => {
  60  |     await loginAsAdmin(page)
  61  | 
  62  |     await page.goto('/workspace/beneficiarios')
  63  |     await page.waitForLoadState('domcontentloaded')
  64  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  65  |     await page.waitForFunction(() => document.querySelectorAll('#filter-olla option').length >= 2, { timeout: 30000 })
  66  | 
  67  |     await context.setOffline(true)
  68  |     await page.waitForTimeout(1000)
  69  | 
  70  |     await expect(page.locator('text=Sin conexión — Modo offline')).toBeVisible({ timeout: 35000 })
  71  | 
  72  |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  73  |     await page.click('button:has-text("Registrar Beneficiario")')
  74  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  75  | 
  76  |     await page.fill('#beneficiary-firstName', 'OfflineTest')
  77  |     await page.fill('#beneficiary-lastName', 'Playwright')
  78  |     await page.fill('#beneficiary-dni', randomDni)
  79  |     await page.fill('#beneficiary-birthDate', '1995-08-25')
  80  | 
  81  |     await page.selectOption('div.z-50 select', { index: 0 })
  82  | 
  83  |     await page.click('div.z-50 button:has-text("Registrar")')
  84  | 
  85  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  86  | 
  87  |     await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 35000 })
  88  | 
  89  |     await restoreNetworkAndFireOnlineEvent(page, context)
  90  | 
  91  |     await expect(page.locator('text=Sin conexión — Modo offline')).not.toBeVisible({ timeout: 45000 })
  92  | 
  93  |     const dbBeneficiary = await pollDb(() =>
  94  |       prisma.beneficiary.findFirst({ where: { firstName: 'OfflineTest', lastName: 'Playwright' } }),
  95  |     )
  96  | 
  97  |     expect(dbBeneficiary).not.toBeNull()
  98  |     expect(dbBeneficiary.firstName).toBe('OfflineTest')
  99  | 
  100 |     await prisma.beneficiary.delete({
  101 |       where: { id: dbBeneficiary.id }
  102 |     }).catch(() => {})
  103 |   })
  104 | 
  105 |   test('Test Offline: Registro de ración offline con sincronización', async ({ page, context }) => {
  106 |     const testDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  107 |     const tenant = await prisma.tenant.findFirst()
  108 |     if (!tenant) throw new Error('No hay tenants en base de datos para las pruebas')
  109 |     const firstOlla = await prisma.ollaComun.findFirst({
  110 |       where: { tenantId: tenant.id, status: 'active' },
  111 |       orderBy: { name: 'asc' }
  112 |     })
  113 |     if (!firstOlla) throw new Error('No hay ollas activas en base de datos para las pruebas')
  114 | 
  115 |     const b = await prisma.beneficiary.create({
  116 |       data: {
  117 |         firstName: 'RacionTest',
  118 |         lastName: 'Playwright',
  119 |         dni: testDni,
  120 |         birthDate: new Date('1990-01-01'),
  121 |         ollaId: firstOlla.id,
  122 |         tenantId: tenant.id
  123 |       }
  124 |     })
  125 | 
  126 |     const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  127 |     const formatter = new Intl.DateTimeFormat('en-US', options)
  128 |     const parts = formatter.formatToParts(new Date())
  129 |     const year = parts.find(p => p.type === 'year')?.value
  130 |     const month = parts.find(p => p.type === 'month')?.value
  131 |     const day = parts.find(p => p.type === 'day')?.value
  132 |     const dateString = `${year}-${month}-${day}`
  133 |     const operationDate = new Date(dateString)
  134 | 
  135 |     let menuPlan = await prisma.menuPlan.findFirst({
  136 |       where: {
  137 |         ollaId: firstOlla.id,
  138 |         operationDate
  139 |       }
  140 |     })
  141 |     if (!menuPlan) {
  142 |       menuPlan = await prisma.menuPlan.create({
  143 |         data: {
  144 |           ollaId: firstOlla.id,
  145 |           operationDate,
  146 |           dishName: 'Tallarines con salsa',
  147 |           plannedServings: 50,
  148 |           status: 'approved',
  149 |           suggestedByType: 'user',
  150 |           createdBy: (await prisma.appUser.findFirst())?.id
```
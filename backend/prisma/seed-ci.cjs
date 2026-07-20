/**
 * Siembra el conjunto mínimo de datos que necesitan las pruebas de integración
 * y funcionales para arrancar contra una base de datos recién creada.
 *
 * El seed normal (`seed.cjs`) da por hecho que ya existe un tenant, porque en
 * desarrollo lo aportan las migraciones de Supabase. En CI la base nace vacía
 * a partir de `prisma db push`, así que aquí se crea todo desde cero.
 *
 * Es idempotente: puede ejecutarse varias veces sobre la misma base.
 */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@ollascomunes.pe'
const ADMIN_PASSWORD = 'admin123'

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: 'CI-TEST' },
    update: {},
    create: {
      code: 'CI-TEST',
      name: 'Municipalidad de Prueba CI',
      category: 'Municipalidad',
      location: 'Lima',
      status: 'active',
    },
  })

  // Una sola olla activa: el backfill de `olla_id` y varias pruebas asumen que
  // la organización no tiene ambigüedad de asignación.
  const olla = await prisma.ollaComun.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'OLLA-CI-1' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'OLLA-CI-1',
      name: 'Olla Comun CI',
      address: 'Av. Prueba 123',
      status: 'active',
    },
  })

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await prisma.appUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, status: 'active' },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      fullName: 'Administrador CI',
      role: 'admin_municipal',
      status: 'active',
      tenantId: tenant.id,
      // Sin secreto: las pruebas lo obtienen por /api/auth/totp/setup, que es
      // el flujo real. Sembrarlo aquí saltaría ese paso.
      totpSecret: null,
    },
  })

  // Lideresa con olla asignada, para ejercitar el alcance por fila.
  const lideresaHash = await bcrypt.hash('LideresaPass123', 12)
  await prisma.appUser.upsert({
    where: { email: 'lideresa@ollascomunes.pe' },
    update: { ollaId: olla.id },
    create: {
      email: 'lideresa@ollascomunes.pe',
      passwordHash: lideresaHash,
      fullName: 'Lideresa CI',
      role: 'lideresa_olla',
      status: 'active',
      tenantId: tenant.id,
      ollaId: olla.id,
    },
  })

  // Categoría e insumo: `functional.test.ts` los crea si faltan, pero recurre a
  // `categoryId: 1` cuando no hay ninguna categoría, y ese id no existe en una
  // base recién creada. Sembrarlos evita la violación de clave foránea.
  const categoria = await prisma.supplyCategory.upsert({
    where: { name: 'Abarrotes' },
    update: {},
    create: { name: 'Abarrotes' },
  })

  await prisma.supplyItem.upsert({
    where: { name_unit: { name: 'Arroz', unit: 'kg' } },
    update: {},
    create: {
      name: 'Arroz',
      unit: 'kg',
      categoryId: categoria.id,
      status: 'active',
    },
  })

  // Condiciones de salud: el padrón las referencia por id.
  for (const nombre of ['Anemia', 'Diabetes']) {
    await prisma.healthCondition.upsert({
      where: { name: nombre },
      update: {},
      create: { name: nombre },
    })
  }

  console.log(`Seed CI listo. Tenant ${tenant.code}, olla ${olla.code}.`)
}

main()
  .catch((err) => {
    console.error('Seed CI fallido:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

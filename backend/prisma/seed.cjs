const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv/config')

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) { console.error('DATABASE_URL no configurada'); process.exit(1) }

  const adapter = new PrismaPg({ connectionString: url, ssl: { rejectUnauthorized: false } })
  const prisma = new PrismaClient({ adapter })

  try {
    const tenants = await prisma.tenant.findMany({ take: 1 })
    if (tenants.length === 0) {
      console.error('No hay tenants en la DB. Crea al menos uno primero.')
      process.exit(1)
    }

    const email = process.argv[2] || 'admin@ollascomunes.pe'
    const password = process.argv[3] || 'admin123'
    const tenantId = process.argv[4] || tenants[0].id
    const fullName = process.argv[5] || 'Admin Principal'
    const role = process.argv[6] || 'admin_municipal'

    const existing = await prisma.appUser.findUnique({ where: { email } })
    if (existing) {
      console.log(`Usuario ${email} ya existe.`)
      await prisma.$disconnect()
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.appUser.create({
      data: { email, passwordHash, fullName, tenantId, role },
    })

    console.log(`Usuario creado:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Nombre: ${fullName}`)
    console.log(`  Rol: ${role}`)
    console.log(`  Tenant: ${tenants.find(t => t.id === tenantId)?.name ?? tenantId}`)

    await prisma.$disconnect()
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

seed()

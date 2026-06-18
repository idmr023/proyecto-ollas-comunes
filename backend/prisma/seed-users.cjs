const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv/config')

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) { console.error('DATABASE_URL no configurada'); process.exit(1) }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const tenants = await prisma.tenant.findMany({ take: 1 })
    if (tenants.length === 0) {
      console.error('No hay tenants en la DB. Crea al menos uno primero.')
      process.exit(1)
    }
    const tenantId = tenants[0].id
    const tenantName = tenants[0].name

    const users = [
      { email: 'c29744@utp.edu.pe', fullName: 'Admin UTP', role: 'admin_municipal' },
      { email: 'c29744+colaborador@utp.edu.pe', fullName: 'Colaborador UTP', role: 'lideresa_olla' },
      { email: 'meneses.van71@gmail.com', fullName: 'Admin Vanesa', role: 'admin_municipal' },
      { email: 'meneses.van71+colaborador@gmail.com', fullName: 'Colaborador Vanesa', role: 'lideresa_olla' },
    ]

    const passwordHash = await bcrypt.hash('admin123', 10)

    for (const user of users) {
      const existing = await prisma.appUser.findUnique({ where: { email: user.email } })
      if (existing) {
        console.log(`  Usuario ${user.email} ya existe. Saltando.`)
        continue
      }

      await prisma.appUser.create({
        data: {
          email: user.email,
          passwordHash,
          fullName: user.fullName,
          tenantId,
          role: user.role,
        },
      })
      console.log(`  Creado: ${user.email} (${user.role}) - ${user.fullName}`)
    }

    console.log(`\nTenant: ${tenantName} (${tenantId})`)
    console.log('Contraseña para todas: admin123')

    await prisma.$disconnect()
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

seed()

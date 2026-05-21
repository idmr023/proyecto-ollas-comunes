const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv/config')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  // --- Tus queries aquí ---
  const tenants = await prisma.tenant.findMany()

  const tenants2= await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
    take: 10,
  })

  // SELECT * FROM tenants ORDER BY name ASC
  const tenants5 = await prisma.tenant.findMany({ orderBy: { name: 'asc' } })

  // SELECT id, name FROM tenants WHERE status = 'active' LIMIT 10
  const tenants3 = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, name: true },
    take: 10,
  })

  // SELECT * FROM tenants WHERE name ILIKE '%municipalidad%'
  const tenants4 = await prisma.tenant.findMany({
    where: { name: { contains: 'municipalidad', mode: 'insensitive' } },
  })


  console.log('tenants:', tenants.length + '\n' +
    'ejemplo 2 tenants 2:', tenants2.length + '\n' +
    'ejemplo 3 tenants 3:', tenants3.length + '\n' +
    'ejemplo 4 tenants 4:', tenants4.length + '\n' +
    'ejemplo 5 tenants 5:', tenants5.length)

  

  await prisma.$disconnect()
}

main().catch(console.error)

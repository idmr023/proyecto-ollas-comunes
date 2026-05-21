import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function test() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('DATABASE_URL no esta configurada en el entorno')
    process.exit(1)
  }

  const masked = url.replace(/:\/\/.*?:.*?@/, '://user:****@')
  console.log('Probando conexion a:', masked)

  const adapter = new PrismaPg({ connectionString: url, ssl: true })
  const prisma = new PrismaClient({ adapter })

  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`
    console.log('Conexion exitosa:', JSON.stringify(result))
    await prisma.$disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error de conexion:', err.message)
    if (err.code) console.error('Codigo:', err.code)
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

test()

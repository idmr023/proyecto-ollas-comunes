import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  await prisma.$executeRawUnsafe('ALTER TABLE beneficiaries ALTER COLUMN dni TYPE varchar(128)')
  console.log('OK: dni column altered to varchar(128)')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

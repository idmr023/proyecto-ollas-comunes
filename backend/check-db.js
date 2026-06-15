const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.appUser.findUnique({
    where: { email: 'admin@ollascomunes.pe' }
  });
  console.log('User:', user);
  
  const olla = await prisma.ollaComun.findFirst({
    where: { tenantId: user.tenantId, status: 'active' }
  });
  console.log('Olla:', olla);

  const beneficiary = await prisma.beneficiary.findFirst({
    where: { ollaId: olla.id }
  });
  console.log('Beneficiary:', beneficiary);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

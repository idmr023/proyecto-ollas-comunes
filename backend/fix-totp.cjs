const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { generateSecret } = require('otplib');

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://user:pass@127.0.0.1:5432/db', ssl: false });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const secret = generateSecret();
  console.log('Secret:', secret, 'Length:', secret.length);
  
  await prisma.appUser.update({
    where: { email: 'admin@ollascomunes.pe' },
    data: { totpSecret: secret }
  });
  
  const user = await prisma.appUser.findUnique({ where: { email: 'admin@ollascomunes.pe' } });
  console.log('Stored:', user.totpSecret);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

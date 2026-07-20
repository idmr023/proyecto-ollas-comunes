const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://user:pass@127.0.0.1:5432/db', ssl: false });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const hash = await bcrypt.hash('admin123', 10);
  console.log('Hash:', hash);
  
  await prisma.appUser.update({
    where: { email: 'admin@ollascomunes.pe' },
    data: { passwordHash: hash }
  });
  
  const user = await prisma.appUser.findUnique({ where: { email: 'admin@ollascomunes.pe' } });
  console.log('Stored:', user.passwordHash);
  const match = await bcrypt.compare('admin123', user.passwordHash);
  console.log('Match:', match);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

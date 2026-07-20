const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { cleanupInvalidDnis } = require('./scripts/cleanup-dni-logic.cjs');

module.exports = { forceStringCode, after };

async function forceStringCode(requestContext, events) {
  if (requestContext.json && requestContext.json.code !== undefined) {
    requestContext.json.code = String(requestContext.json.code);
  }
}

async function after(context, done) {
  console.log('\n[CLEANUP] Iniciando limpieza de DNIs inválidos...');

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('[CLEANUP] DATABASE_URL no configurada. Saltando limpieza.');
    return done();
  }

  let prisma;
  try {
    const adapter = new PrismaPg({ connectionString: url, ssl: true });
    prisma = new PrismaClient({ adapter });

    const result = await cleanupInvalidDnis(prisma, { apply: true });

    console.log(`[CLEANUP] Beneficiarios con DNI: ${result.total}`);
    console.log(`[CLEANUP] Válidos: ${result.valid} | Inválidos: ${result.invalid}`);

    if (result.cleaned > 0) {
      console.log(`[CLEANUP] ${result.cleaned} DNIs inválidos puestos en NULL:`);
      for (const item of result.items) {
        console.log(`  ✓ ${item.name} (${item.id}) — DNI: "${item.dni}"`);
      }
    } else {
      console.log('[CLEANUP] No hay DNIs inválidos. Nada que limpiar.');
    }

    console.log('[CLEANUP] Limpieza completada.');
  } catch (err) {
    console.error('[CLEANUP] Error durante la limpieza:', err.message);
  } finally {
    if (prisma) await prisma.$disconnect().catch(() => {});
    done();
  }
}

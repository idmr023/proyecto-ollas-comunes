/**
 * cleanup-invalid-dnis.mjs
 *
 * Script de limpieza manual para DNIs inválidos en producción.
 * Reutiliza la lógica de cleanup-dni-logic.cjs.
 *
 * USO:
 *   node scripts/cleanup-invalid-dnis.mjs              → dry-run (solo muestra)
 *   node scripts/cleanup-invalid-dnis.mjs --apply      → aplica cambios (SET dni = NULL)
 *   node scripts/cleanup-invalid-dnis.mjs --delete     → elimina beneficiarios con DNI inválido
 */

import { createRequire } from 'module'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const require = createRequire(import.meta.url)
const { cleanupInvalidDnis, decryptDeterministic, getEncryptionKey } = require('./cleanup-dni-logic.cjs')

const APPLY = process.argv.includes('--apply')
const DELETE = process.argv.includes('--delete')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL no está configurada.')
    process.exit(1)
  }

  const masked = url.replace(/:\/\/[^/\s:@]+:[^/\s:@]+@/, '://user:****@')
  console.log(`Modo: ${DELETE ? 'ELIMINAR beneficiarios' : APPLY ? 'APLICAR (SET dni = NULL)' : 'DRY-RUN (solo lectura)'}`)
  console.log(`Base de datos: ${masked}\n`)

  const adapter = new PrismaPg({ connectionString: url, ssl: true })
  const prisma = new PrismaClient({ adapter })

  try {
    const result = await cleanupInvalidDnis(prisma, { apply: APPLY })

    console.log(`Beneficiarios con DNI no nulo: ${result.total}\n`)
    console.log(`  Válidos (8 dígitos):  ${result.valid}`)
    console.log(`  Inválidos:           ${result.invalid}`)

    if (result.invalid === 0) {
      console.log('\n✓ No hay DNIs inválidos. No se requiere limpieza.')
      await prisma.$disconnect()
      process.exit(0)
    }

    console.log('\n--- DNIs INVÁLIDOS ---\n')
    for (const item of result.items) {
      const reason = !item.dni
        ? 'NULL/empty'
        : !/^\d+$/.test(item.dni)
          ? `contiene letras (${item.dni.length} chars)`
          : `${item.dni.length} dígitos`
      console.log(`  ${item.id}  |  ${item.name}  |  DNI: "${item.dni}"  |  ${reason}`)
    }

    if (APPLY) {
      console.log(`\n✓ ${result.cleaned} DNIs inválidos puestos en NULL.`)
    } else if (DELETE) {
      console.log(`\nEliminando ${result.invalid} beneficiarios con DNI inválido...`)
      for (const item of result.items) {
        await prisma.beneficiary.delete({ where: { id: item.id } })
        console.log(`  ✓ Eliminado: ${item.name} (${item.id})`)
      }
      console.log('\n✓ Eliminación completada.')
    } else {
      console.log('\n--- DRY-RUN COMPLETADO ---')
      console.log('Para aplicar cambios ejecuta:')
      console.log('  node scripts/cleanup-invalid-dnis.mjs --apply    → ponen DNI en NULL')
      console.log('  node scripts/cleanup-invalid-dnis.mjs --delete   → elimina el beneficiario')
    }

    await prisma.$disconnect()
  } catch (err) {
    console.error('Error durante la limpieza:', err.message)
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

await main()

/**
 * cleanup-dni-logic.cjs
 *
 * Lógica compartida de limpieza de DNIs inválidos.
 * Usado por stress-test-processor.js (Artillery after hook)
 * y por cleanup-invalid-dnis.mjs (ejecución manual).
 */

const crypto = require('crypto');

const DNI_REGEX = /^\d{8}$/;

function getEncryptionKey() {
  const encKey = process.env.DB_ENCRYPTION_KEY;
  if (encKey) {
    if (encKey.length === 64) return Buffer.from(encKey, 'hex');
    return crypto.createHash('sha256').update(encKey).digest();
  }
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
  return crypto.createHash('sha256').update(jwtSecret).digest();
}

function decryptDeterministic(cipherText, key) {
  if (!cipherText) return null;
  const parts = cipherText.split(':');
  if (parts.length !== 2) return cipherText;
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return cipherText;
  }
}

/**
 * Ejecuta la limpieza de DNIs inválidos.
 * @param {object} prisma - Instancia de PrismaClient
 * @param {object} [options] - Opciones
 * @param {boolean} [options.apply=false] - Si true, pone dni=NULL. Si false, solo reporta.
 * @returns {{ total: number, valid: number, invalid: number, cleaned: number }}
 */
async function cleanupInvalidDnis(prisma, options = {}) {
  const { apply = false } = options;
  const key = getEncryptionKey();

  const rows = await prisma.beneficiary.findMany({
    where: { dni: { not: null } },
    select: { id: true, dni: true, firstName: true, lastName: true },
  });

  const invalid = [];

  for (const row of rows) {
    const decrypted = decryptDeterministic(row.dni, key);
    if (!decrypted || !DNI_REGEX.test(decrypted)) {
      invalid.push({ ...row, decryptedDni: decrypted });
    }
  }

  let cleaned = 0;

  if (apply && invalid.length > 0) {
    for (const item of invalid) {
      await prisma.beneficiary.update({
        where: { id: item.id },
        data: { dni: null },
      });
      cleaned++;
    }
  }

  return {
    total: rows.length,
    valid: rows.length - invalid.length,
    invalid: invalid.length,
    cleaned,
    items: invalid.map((i) => ({
      id: i.id,
      name: `${i.firstName} ${i.lastName}`,
      dni: i.decryptedDni,
    })),
  };
}

module.exports = { getEncryptionKey, decryptDeterministic, cleanupInvalidDnis, DNI_REGEX };

import crypto from 'crypto'

/**
 * Punto unico de resolucion de secretos criptograficos.
 *
 * Regla de oro: si un secreto falta o es debil, la aplicacion NO arranca.
 * Un fallback silencioso es peor que una caida, porque firma tokens con un
 * valor conocido y da una falsa sensacion de seguridad.
 */

const MIN_SECRET_LENGTH = 32

const isProduction = process.env.NODE_ENV === 'production'

function requireSecret(name: string): string {
  const value = process.env[name]

  if (!value || value.trim().length === 0) {
    throw new Error(
      `[config] ${name} no esta configurada. La aplicacion no puede arrancar sin ella.`,
    )
  }

  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[config] ${name} debe tener al menos ${MIN_SECRET_LENGTH} caracteres ` +
        `(actual: ${value.length}). Genera uno con: openssl rand -hex 32`,
    )
  }

  return value
}

/** Clave de FIRMA de JWT. Nunca debe usarse para cifrar datos en reposo. */
export const JWT_SECRET = requireSecret('JWT_SECRET')

/**
 * Clave de CIFRADO en reposo (AES-256), independiente de la de firma.
 *
 * En produccion es obligatoria: reutilizar JWT_SECRET significa que rotar la
 * clave de firma vuelve ilegible el DNI y el secreto TOTP ya almacenados.
 * En desarrollo/test se deriva de JWT_SECRET para no obligar a configurarla.
 */
function resolveEncryptionKey(): Buffer {
  const raw = process.env.DB_ENCRYPTION_KEY

  if (raw && raw.trim().length > 0) {
    // Hex de 64 caracteres => 32 bytes exactos, el caso preferido.
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex')
    }

    if (raw.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `[config] DB_ENCRYPTION_KEY debe ser hex de 64 caracteres o texto de al ` +
          `menos ${MIN_SECRET_LENGTH}. Genera una con: openssl rand -hex 32`,
      )
    }

    return crypto.createHash('sha256').update(raw).digest()
  }

  if (isProduction) {
    throw new Error(
      '[config] DB_ENCRYPTION_KEY es obligatoria en produccion. No se permite ' +
        'derivarla de JWT_SECRET: rotar la clave de firma dejaria ilegibles el ' +
        'DNI y el secreto TOTP ya cifrados.',
    )
  }

  return crypto.createHash('sha256').update(JWT_SECRET).digest()
}

export const DB_ENCRYPTION_KEY = resolveEncryptionKey()

/**
 * Forma canonica 8-4-4-4-12 en hexadecimal.
 *
 * Deliberadamente NO se exigen los nibbles de version/variante: el objetivo es
 * impedir que un identificador acabe inyectando SQL, y para eso basta con
 * restringir el alfabeto a hex y guiones. Exigir v4 estricto rechazaria ids
 * legitimos de semilla (p. ej. 2222...-2222-...) sin ganar seguridad.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

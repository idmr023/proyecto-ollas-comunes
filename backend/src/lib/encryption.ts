import crypto from 'crypto'

const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'

// Derivar una clave de 32 bytes (256 bits) para AES-256
function getEncryptionKey(): Buffer {
  if (DB_ENCRYPTION_KEY) {
    // Si es un hex string de 64 caracteres, convertir a Buffer de 32 bytes
    if (DB_ENCRYPTION_KEY.length === 64) {
      return Buffer.from(DB_ENCRYPTION_KEY, 'hex')
    }
    // Si es texto arbitrario, hashearlo a 32 bytes
    return crypto.createHash('sha256').update(DB_ENCRYPTION_KEY).digest()
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[SECURITY WARNING] DB_ENCRYPTION_KEY no está configurada en producción. Derivando de JWT_SECRET.')
  }
  
  return crypto.createHash('sha256').update(JWT_SECRET).digest()
}

const key = getEncryptionKey()

/**
 * Cifra un texto usando AES-256-GCM (cifrado probabilístico con IV aleatorio).
 * Ideal para datos donde no se requieren búsquedas exactas (ej. secreto TOTP).
 */
export function encryptGcm(text: string): string {
  const iv = crypto.randomBytes(12) // GCM prefiere IV de 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Guardar iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}/**
 * Descifra un texto cifrado con AES-256-GCM.
 * Si no está cifrado o falla, retorna el texto original.
 */
export function decryptGcm(cipherText: string): string {
  const parts = cipherText.split(':')
  if (parts.length !== 3) {
    return cipherText // Retornar texto original si no tiene formato cifrado
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    return cipherText
  }
}

/**
 * Cifra un texto de forma determinista usando AES-256-CBC.
 * El IV se deriva del propio valor a cifrar mediante HMAC.
 * Ideal para campos únicos que requieren búsquedas de coincidencia exacta (ej. DNI).
 */
export function encryptDeterministic(text: string): string {
  // Derivar un IV estático/determinista a partir del texto y la clave
  const iv = crypto
    .createHmac('sha256', key)
    .update(text)
    .digest()
    .slice(0, 16) // CBC requiere IV de 16 bytes
    
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Guardar iv:encrypted
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Descifra un texto cifrado deterministamente con AES-256-CBC.
 * Si el texto no está en formato cifrado o la desencriptación falla, retorna el texto original.
 */
export function decryptDeterministic(cipherText: string): string {
  const parts = cipherText.split(':')
  if (parts.length !== 2) {
    return cipherText // Retornar texto original si no tiene formato cifrado
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (err) {
    return cipherText
  }
}

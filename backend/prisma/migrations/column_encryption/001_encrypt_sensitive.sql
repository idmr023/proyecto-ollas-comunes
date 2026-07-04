-- ================================================================
-- SIGO-OLLAS — Column-Level Encryption (3.4) + Blind Hash (3.5)
-- Cifrado AES-256 de datos sensibles + hash determinista para búsquedas
-- Ejecutar: npx prisma db execute --file prisma/migrations/column_encryption/001_encrypt_sensitive.sql
-- ================================================================

-- 1. Asegurar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Clave de cifrado (debe ser una variable de entorno en producción)
--    En Render: ENCRYPTION_KEY=... (256-bit hex)
--    Esta es SOLO para desarrollo:
DO $$
BEGIN
  PERFORM set_config('app.encryption_key', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b', false);
END;
$$;

-- 3. Función de cifrado (pgp_sym_encrypt con clave de sesión)
CREATE OR REPLACE FUNCTION audit.encrypt_sensitive(plaintext text)
RETURNS bytea
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF plaintext IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(
    plaintext,
    current_setting('app.encryption_key'),
    'compress-algo=2, cipher-algo=aes256'
  );
END;
$$;

-- 4. Función de descifrado
CREATE OR REPLACE FUNCTION audit.decrypt_sensitive(ciphertext bytea)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF ciphertext IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(
    ciphertext,
    current_setting('app.encryption_key')
  );
END;
$$;

-- 5. Agregar columnas cifradas + hash ciego a beneficiaries
ALTER TABLE beneficiaries
  ADD COLUMN IF NOT EXISTS encrypted_dni bytea,
  ADD COLUMN IF NOT EXISTS encrypted_phone bytea,
  ADD COLUMN IF NOT EXISTS encrypted_address bytea,
  ADD COLUMN IF NOT EXISTS dni_hash bytea UNIQUE;

-- 6. Poblar columnas cifradas con datos existentes
UPDATE beneficiaries SET
  encrypted_dni = audit.encrypt_sensitive(dni),
  encrypted_phone = audit.encrypt_sensitive(phone),
  encrypted_address = audit.encrypt_sensitive(address),
  dni_hash = digest(dni, 'sha256')
WHERE dni IS NOT NULL;

-- 7. Agregar columnas cifradas a app_users
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS encrypted_email bytea,
  ADD COLUMN IF NOT EXISTS email_hash bytea UNIQUE;

UPDATE app_users SET
  encrypted_email = audit.encrypt_sensitive(email),
  email_hash = digest(email, 'sha256')
WHERE email IS NOT NULL;

-- 8. Crear función para búsqueda por hash (búsqueda ciega)
CREATE OR REPLACE FUNCTION audit.find_by_dni_hash(search_dni text)
RETURNS SETOF beneficiaries
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY SELECT * FROM beneficiaries WHERE dni_hash = digest(search_dni, 'sha256');
END;
$$;

-- 9. Trigger: mantener hash actualizado automáticamente
CREATE OR REPLACE FUNCTION audit.sync_encrypted_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.dni IS DISTINCT FROM OLD.dni THEN
    NEW.dni_hash := digest(NEW.dni, 'sha256');
    NEW.encrypted_dni := audit.encrypt_sensitive(NEW.dni);
  END IF;
  IF TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone THEN
    NEW.encrypted_phone := audit.encrypt_sensitive(NEW.phone);
  END IF;
  IF TG_OP = 'INSERT' OR NEW.address IS DISTINCT FROM OLD.address THEN
    NEW.encrypted_address := audit.encrypt_sensitive(NEW.address);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_beneficiary_encryption
  BEFORE INSERT OR UPDATE OF dni, phone, address ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION audit.sync_encrypted_columns();

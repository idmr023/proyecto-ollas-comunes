-- ================================================================
-- MIGRACION: Ampliar columna dni para soportar cifrado determinista
-- FECHA: 2026-07-18
-- MOTIVO: encryptDeterministic() produce ~65+ chars (iv:ciphertext)
--         pero la columna dni es varchar(20), causando P2000 en tests
-- ================================================================

ALTER TABLE beneficiaries ALTER COLUMN dni TYPE varchar(128);

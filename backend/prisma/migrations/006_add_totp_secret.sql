-- Migration: 006_add_totp_secret.sql
-- Agrega el campo totp_secret a la tabla app_users para TOTP (autenticación en dos pasos sin email)

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS totp_secret varchar(255);

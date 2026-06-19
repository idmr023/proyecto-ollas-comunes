-- Migration: 007_recommendations_cache.sql
-- Convierte la tabla recommendations en caché de la IA pasiva:
--  - payload JSONB para los datos estructurados que consume la app
--  - expires_at para el TTL del cacheo
--  - índice único (olla, tipo, fecha) para que el job sea idempotente (upsert)

ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS expires_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reco_olla_tipo_fecha
  ON public.recommendations (olla_id, recommendation_type, target_date);

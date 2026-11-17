-- ============================================================
-- 02_seguridad_avanzada.sql
-- Ejecutar en Supabase (SQL Editor) para habilitar 2FA real y bloqueo.
-- ============================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS otp_codigo VARCHAR(6) NULL,
  ADD COLUMN IF NOT EXISTS otp_expira_en TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ NULL;
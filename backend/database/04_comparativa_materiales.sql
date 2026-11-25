-- ============================================================
-- 04_comparativa_materiales.sql
-- Migración aditiva e idempotente: materiales presupuestados vs. reales.
-- NO ejecutar backend/schema.sql en producción (contiene DROP TABLE ... CASCADE).
-- ============================================================

ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS materiales_presupuestados JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Normalización defensiva por si la columna existiera con valores NULL.
UPDATE solicitudes
   SET materiales_presupuestados = '[]'::jsonb
 WHERE materiales_presupuestados IS NULL;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================

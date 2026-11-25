-- ============================================================
-- 03_cotizaciones_materiales_tecnicos.sql
-- Migración aditiva e idempotente para JG Frío y Agroindustria.
-- Ejecutar en Supabase (SQL Editor) o: psql "$DATABASE_URL" -f 03_cotizaciones_materiales_tecnicos.sql
-- NO ejecutar backend/schema.sql en producción (contiene DROP TABLE ... CASCADE).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Corregir la restricción de estados de cotizaciones.
--    Se buscan dinámicamente todos los CHECK que apunten a la
--    columna estado para no depender del nombre autogenerado.
-- ------------------------------------------------------------
DO $$
DECLARE
  restriccion RECORD;
BEGIN
  FOR restriccion IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'cotizaciones'::regclass
      AND contype = 'c'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute
         WHERE attrelid = 'cotizaciones'::regclass AND attname = 'estado')
      ]::smallint[]
  LOOP
    EXECUTE format('ALTER TABLE cotizaciones DROP CONSTRAINT %I', restriccion.conname);
  END LOOP;
END
$$;

ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_estado_check
  CHECK (estado IN ('Nueva', 'En revisión', 'Enviada', 'Aceptada', 'Rechazada'));

-- ------------------------------------------------------------
-- 2. Evaluación económica y rentabilidad de cotizaciones.
-- ------------------------------------------------------------
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS costo_materiales NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS costo_mano_obra NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otros_costos NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precio_cotizado NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margen_porcentaje NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_rentable BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS materiales_estimados JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notas_evaluacion TEXT DEFAULT '';

-- ------------------------------------------------------------
-- 3. Catálogo de materiales / repuestos e inventario.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repuestos (
  id             SERIAL PRIMARY KEY,
  codigo         VARCHAR(30) UNIQUE NOT NULL,
  nombre         VARCHAR(140) NOT NULL,
  unidad         VARCHAR(30) NOT NULL DEFAULT 'unidad',
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta   NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT NOW()
);

INSERT INTO repuestos (codigo, nombre, unidad, costo_unitario, precio_venta, stock) VALUES
  ('REP-001', 'Compresor Hermético 3HP',                     'unidad', 280000, 395000,  8),
  ('REP-002', 'Gas Refrigerante R404A',                      'kg',      24000,  38000, 45),
  ('REP-003', 'Controlador Digital Full Gauge MT-512E',      'unidad',  42000,  68000, 15),
  ('REP-004', 'Válvula de Expansión Termostática',           'unidad',  55000,  85000, 10),
  ('REP-005', 'Cañería de Cobre Flexible 1/2"',              'metro',    6500,  11000, 60),
  ('REP-006', 'Filtro Secador Soldable 3/8"',                'unidad',  12000,  21000, 20)
ON CONFLICT (codigo) DO NOTHING;

-- ------------------------------------------------------------
-- 4. Trazabilidad de repuestos consumidos por orden de trabajo.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_repuestos (
  id           SERIAL PRIMARY KEY,
  solicitud_id INT REFERENCES solicitudes(id) ON DELETE CASCADE,
  repuesto_id  INT REFERENCES repuestos(id) ON DELETE RESTRICT,
  cantidad     INT NOT NULL CHECK (cantidad > 0),
  costo_total  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orden_repuestos_solicitud ON orden_repuestos(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_repuestos_nombre ON repuestos(nombre);

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================

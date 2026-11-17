-- ============================================================
-- schema.sql — Base de datos PostgreSQL para JG Frío y Agroindustria
-- Ejecutar: psql -U <usuario> -d <base> -f schema.sql
-- ============================================================

-- Limpieza (solo desarrollo)
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS adjuntos CASCADE;
DROP TABLE IF EXISTS cotizaciones CASCADE;
DROP TABLE IF EXISTS solicitudes CASCADE;
DROP TABLE IF EXISTS historial CASCADE;
DROP TABLE IF EXISTS instalaciones CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS tecnicos CASCADE;

-- ---------- TÉCNICOS ----------
CREATE TABLE tecnicos (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  zona          VARCHAR(80)  NOT NULL,
  especialidad  VARCHAR(120) NOT NULL,
  disponible    BOOLEAN      NOT NULL DEFAULT TRUE,
  nota          TEXT         NOT NULL DEFAULT '',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------- USUARIOS ----------
CREATE TABLE usuarios (
  id               SERIAL PRIMARY KEY,
  email            VARCHAR(160) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  nombre           VARCHAR(120) NOT NULL,
  rol              VARCHAR(20)  NOT NULL CHECK (rol IN ('encargado','ventas','tecnico','admin')),
  dos_fa           BOOLEAN      NOT NULL DEFAULT FALSE,
  tec_id           INT          REFERENCES tecnicos(id) ON DELETE SET NULL,
  intentos_fallidos INT         NOT NULL DEFAULT 0,
  bloqueado_hasta  TIMESTAMP,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------- CLIENTES ----------
CREATE TABLE clientes (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(160) NOT NULL,
  rubro      VARCHAR(80)  NOT NULL,
  zona       VARCHAR(80)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------- INSTALACIONES ----------
CREATE TABLE instalaciones (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  equipo      VARCHAR(160) NOT NULL,
  ubicacion   VARCHAR(160),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- HISTORIAL DE MANTENCIONES ----------
CREATE TABLE historial (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha       DATE NOT NULL,
  tipo        VARCHAR(60) NOT NULL,
  descripcion TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- SOLICITUDES / ÓRDENES DE TRABAJO ----------
CREATE TABLE solicitudes (
  id            SERIAL PRIMARY KEY,
  cliente_id    INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  zona          VARCHAR(80)  NOT NULL,
  urgencia      VARCHAR(20)  NOT NULL CHECK (urgencia IN ('Urgente','Alta','Normal')),
  origen        VARCHAR(40)  NOT NULL,
  estado        VARCHAR(20)  NOT NULL DEFAULT 'Pendiente'
                 CHECK (estado IN ('Pendiente','Asignada','En proceso','Finalizado')),
  tec_id        INT REFERENCES tecnicos(id) ON DELETE SET NULL,
  falla         TEXT NOT NULL DEFAULT '',
  repuestos     JSONB NOT NULL DEFAULT '{}'::jsonb,
  observacion   TEXT NOT NULL DEFAULT '',
  firma         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- ADJUNTOS (firmas / fotos) ----------
CREATE TABLE adjuntos (
  id            SERIAL PRIMARY KEY,
  solicitud_id  INT NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo          VARCHAR(40) NOT NULL CHECK (tipo IN ('firma','foto')),
  ruta          TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- COTIZACIONES PÚBLICAS ----------
CREATE TABLE cotizaciones (
  id         SERIAL PRIMARY KEY,
  empresa    VARCHAR(160) NOT NULL,
  correo     VARCHAR(160) NOT NULL,
  rubro      VARCHAR(80)  NOT NULL,
  descripcion TEXT NOT NULL,
  acepta     BOOLEAN NOT NULL DEFAULT FALSE,
  estado     VARCHAR(20) NOT NULL DEFAULT 'Nueva'
              CHECK (estado IN ('Nueva','En revisión','Enviada')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- AUDITORÍA ----------
CREATE TABLE auditoria (
  id          SERIAL PRIMARY KEY,
  fecha       TIMESTAMP NOT NULL DEFAULT NOW(),
  usuario     VARCHAR(160) NOT NULL,
  accion      TEXT NOT NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Técnicos
INSERT INTO tecnicos (id, nombre, zona, especialidad, disponible, nota) VALUES
  (1, 'M. Rojas', 'Los Lagos', 'Refrigeración general', TRUE, 'En base'),
  (2, 'C. Soto',  'Los Lagos', 'Compresores',           TRUE, 'En ruta a Osorno'),
  (3, 'L. Pérez', 'Maule',     'Control y SITRAD',      FALSE, 'En colación');
SELECT setval('tecnicos_id_seq', 3);

-- Clientes
INSERT INTO clientes (id, nombre, rubro, zona) VALUES
  (1, 'Lácteos del Sur',     'Lácteo',        'Los Lagos'),
  (2, 'Pesquera Austral',    'Pesquero',      'Los Lagos'),
  (3, 'Agrícola Maule',      'Agroindustrial','Maule'),
  (4, 'Frigorífico Norte',   'Cárnico',       'Ñuble');
SELECT setval('clientes_id_seq', 4);

-- Instalaciones
INSERT INTO instalaciones (cliente_id, equipo) VALUES
  (1, 'Cámara CM-04'),
  (2, 'Túnel de congelado TC-01'),
  (3, 'Pre-enfriado PE-01'),
  (4, 'Sala proceso SP-02');

-- Historial
INSERT INTO historial (cliente_id, fecha, tipo, descripcion) VALUES
  (1, '2026-06-10', 'Compresor', 'Falla de arranque compresor'),
  (1, '2026-08-22', 'Compresor', 'Sobrecalentamiento compresor'),
  (1, '2026-10-30', 'Compresor', 'Corte térmico compresor'),
  (2, '2026-09-05', 'Gas',       'Recarga R404A'),
  (3, '2026-07-14', 'Control',   'Cambio controlador digital'),
  (4, '2026-03-02', 'Compresor', 'Cambio de aceite');

-- Solicitudes
INSERT INTO solicitudes (id, cliente_id, zona, urgencia, origen, estado, tec_id, falla, repuestos, observacion, firma) VALUES
  (1, 1, 'Los Lagos', 'Urgente', 'SITRAD',    'Pendiente',  NULL, 'Temperatura sobre -15°C', '{}'::jsonb, '', FALSE),
  (2, 2, 'Los Lagos', 'Alta',    'Teléfono',  'Asignada',   2,    'Ruido en ventiladores',   '{}'::jsonb, '', FALSE),
  (3, 3, 'Maule',     'Normal',  'Web',       'Asignada',   3,    'Mantención preventiva',   '{}'::jsonb, '', FALSE),
  (4, 4, 'Ñuble',     'Normal',  'WhatsApp',  'Pendiente',  NULL, 'Revisión de puerta',      '{}'::jsonb, '', FALSE);
SELECT setval('solicitudes_id_seq', 4);

-- Usuarios (password: Demo2026Frio!)
INSERT INTO usuarios (email, password_hash, nombre, rol, dos_fa, tec_id) VALUES
  ('encargado@jgfrio.test', '$2a$10$VWPVE7.i1lT3keeOExtyfeh2KVKgCJIYIPIkU/wxfXpI4HAZETAse', 'Encargado Operaciones', 'encargado', TRUE,  NULL),
  ('ventas@jgfrio.test',    '$2a$10$VWPVE7.i1lT3keeOExtyfeh2KVKgCJIYIPIkU/wxfXpI4HAZETAse', 'Ejecutivo Ventas',      'ventas',    FALSE, NULL),
  ('csoto@jgfrio.test',     '$2a$10$VWPVE7.i1lT3keeOExtyfeh2KVKgCJIYIPIkU/wxfXpI4HAZETAse', 'C. Soto',               'tecnico',   FALSE, 2),
  ('lperez@jgfrio.test',    '$2a$10$VWPVE7.i1lT3keeOExtyfeh2KVKgCJIYIPIkU/wxfXpI4HAZETAse', 'L. Pérez',              'tecnico',   FALSE, 3),
  ('admin@jgfrio.test',     '$2a$10$VWPVE7.i1lT3keeOExtyfeh2KVKgCJIYIPIkU/wxfXpI4HAZETAse', 'Admin Sistema',         'admin',     TRUE,  NULL);

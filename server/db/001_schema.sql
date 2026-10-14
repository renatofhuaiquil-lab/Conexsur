-- =====================================================================
-- CONEXSUR - Esquema de base de datos (PostgreSQL 16)
-- Alcance: MVP (HU-01, 03, 04, 07, 08, 09, 12, 13, 14, 15, 21)
-- Convenciones: tablas y columnas en español, snake_case, claves UUID,
-- montos en pesos chilenos (CLP) como enteros, fechas con zona horaria.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- correos sin distinguir mayúsculas
CREATE EXTENSION IF NOT EXISTS btree_gist; -- restricción de no solapamiento de visitas

-- ---------- Tipos enumerados ----------
CREATE TYPE rol_usuario      AS ENUM ('administrador', 'tecnico', 'cliente');
CREATE TYPE estado_servicio  AS ENUM ('activo', 'cortado');
CREATE TYPE tipo_visita      AS ENUM ('instalacion', 'soporte', 'mantencion');
CREATE TYPE estado_visita    AS ENUM ('solicitada', 'confirmada', 'realizada', 'cancelada');
CREATE TYPE estado_boleta    AS ENUM ('pendiente', 'pagada', 'vencida');
CREATE TYPE estado_pago      AS ENUM ('iniciado', 'pendiente', 'aprobado', 'rechazado', 'cancelado');

-- ---------- Función genérica para actualizar "actualizado_en" ----------
CREATE OR REPLACE FUNCTION fn_actualizar_fecha() RETURNS trigger AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- usuarios (HU-01) ----------
CREATE TABLE usuarios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo             CITEXT NOT NULL UNIQUE,
  clave_hash         TEXT   NOT NULL,                 -- bcrypt/argon2, nunca texto plano
  rol                rol_usuario NOT NULL,
  nombre             TEXT   NOT NULL,
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  intentos_fallidos  SMALLINT NOT NULL DEFAULT 0,     -- bloqueo temporal ante fuerza bruta
  bloqueado_hasta    TIMESTAMPTZ,
  ultimo_acceso      TIMESTAMPTZ,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_usuarios_fecha BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

-- ---------- planes (base para HU-12; administración completa queda en HU-17) ----------
CREATE TABLE planes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL UNIQUE,
  velocidad_mbps  INTEGER NOT NULL CHECK (velocidad_mbps > 0),
  precio_clp      INTEGER NOT NULL CHECK (precio_clp > 0),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- clientes (HU-03, HU-04) ----------
CREATE TABLE clientes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              UUID UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL,
  rut                     TEXT NOT NULL UNIQUE
                          CHECK (rut ~ '^[0-9]{7,8}-[0-9Kk]$'),   -- sin puntos, con guion
  nombre                  TEXT NOT NULL,
  telefono                TEXT,
  correo                  CITEXT,
  direccion               TEXT NOT NULL,
  comuna                  TEXT NOT NULL,
  plan_id                 UUID REFERENCES planes(id),
  estado_servicio         estado_servicio NOT NULL DEFAULT 'activo',
  estado_cambiado_por     UUID REFERENCES usuarios(id),             -- RF-06: quién
  estado_cambiado_en      TIMESTAMPTZ,                              -- RF-06: cuándo
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_nombre ON clientes (lower(nombre));
CREATE INDEX idx_clientes_plan   ON clientes (plan_id);
CREATE TRIGGER trg_clientes_fecha BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

-- ---------- visitas técnicas (HU-07, HU-08, HU-09) ----------
CREATE TABLE visitas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,        -- base del código visible VT-00001
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tecnico_id    UUID REFERENCES usuarios(id),                      -- se asigna al confirmar
  tipo          tipo_visita   NOT NULL,
  motivo        TEXT          NOT NULL,
  inicio        TIMESTAMPTZ   NOT NULL,
  fin           TIMESTAMPTZ   NOT NULL,
  estado        estado_visita NOT NULL DEFAULT 'solicitada',
  creado_en     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (fin > inicio),
  -- Una visita confirmada exige técnico asignado.
  CHECK (estado NOT IN ('confirmada', 'realizada') OR tecnico_id IS NOT NULL),
  -- RF-11: un mismo técnico no puede tener dos visitas confirmadas que se crucen.
  CONSTRAINT visitas_sin_cruce EXCLUDE USING gist (
    tecnico_id WITH =,
    tstzrange(inicio, fin) WITH &&
  ) WHERE (estado = 'confirmada')
);
CREATE INDEX idx_visitas_inicio ON visitas (inicio);
CREATE INDEX idx_visitas_cliente ON visitas (cliente_id);
CREATE TRIGGER trg_visitas_fecha BEFORE UPDATE ON visitas
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

-- ---------- boletas (HU-13) ----------
CREATE TABLE boletas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  periodo       DATE NOT NULL CHECK (periodo = date_trunc('month', periodo)::date), -- 1.º del mes
  monto_clp     INTEGER NOT NULL CHECK (monto_clp > 0),
  vencimiento   DATE NOT NULL,
  estado        estado_boleta NOT NULL DEFAULT 'pendiente',
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, periodo)
);
CREATE INDEX idx_boletas_estado ON boletas (cliente_id, estado);
CREATE TRIGGER trg_boletas_fecha BEFORE UPDATE ON boletas
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

-- ---------- pagos (HU-14, HU-15) ----------
CREATE TABLE pagos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boleta_id            UUID NOT NULL REFERENCES boletas(id),
  cliente_id           UUID NOT NULL REFERENCES clientes(id),
  monto_clp            INTEGER NOT NULL CHECK (monto_clp > 0),    -- se toma de la boleta, nunca del navegador
  estado               estado_pago NOT NULL DEFAULT 'iniciado',
  referencia_externa   UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE, -- external_reference enviada a MP
  mp_preferencia_id    TEXT,                                       -- id de la preferencia creada
  mp_pago_id           TEXT UNIQUE,                                -- id del pago informado por MP (idempotencia)
  confirmado_en        TIMESTAMPTZ,
  creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pagos_boleta ON pagos (boleta_id);
-- Solo puede existir un pago aprobado por boleta.
CREATE UNIQUE INDEX uq_pago_aprobado_por_boleta ON pagos (boleta_id) WHERE estado = 'aprobado';
CREATE TRIGGER trg_pagos_fecha BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha();

-- ---------- notificaciones de Mercado Pago (HU-15, trazabilidad e idempotencia) ----------
CREATE TABLE eventos_mercadopago (
  id            BIGSERIAL PRIMARY KEY,
  mp_pago_id    TEXT,
  tipo          TEXT NOT NULL,
  id_solicitud  TEXT UNIQUE,                  -- cabecera x-request-id: evita reprocesar el mismo aviso
  carga         JSONB NOT NULL,
  firma_valida  BOOLEAN NOT NULL,
  procesado     BOOLEAN NOT NULL DEFAULT FALSE,
  recibido_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eventos_mp_pago ON eventos_mercadopago (mp_pago_id);

-- ---------- auditoría (RNF de seguridad: quién hizo qué y cuándo) ----------
CREATE TABLE auditoria (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id),
  accion      TEXT NOT NULL,                  -- p. ej. 'cliente.cambiar_estado', 'auth.login_fallido'
  entidad     TEXT NOT NULL,
  entidad_id  TEXT,
  detalle     JSONB,
  ip          INET,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_entidad ON auditoria (entidad, entidad_id);

COMMIT;

ALTER TABLE asociacion_pagos
  ALTER COLUMN asociacion_id DROP NOT NULL;

ALTER TABLE asociacion_pagos
  ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS es_trial BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consumido_en TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'asociacion_pagos_target_chk'
  ) THEN
    ALTER TABLE asociacion_pagos
      ADD CONSTRAINT asociacion_pagos_target_chk
      CHECK (asociacion_id IS NOT NULL OR usuario_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_asociacion_pagos_usuario
  ON asociacion_pagos(usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asociacion_pagos_trial_unico_usuario
  ON asociacion_pagos(usuario_id)
  WHERE es_trial = TRUE;

CREATE TABLE IF NOT EXISTS propietarios (
  id SERIAL PRIMARY KEY,
  asociacion_id INTEGER NOT NULL REFERENCES asociaciones(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  membresia_id INTEGER REFERENCES membresias(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email VARCHAR(255) NOT NULL,
  telefono TEXT,
  rif_cedula TEXT,
  direccion TEXT,
  estado_invitacion TEXT NOT NULL DEFAULT 'PENDIENTE_INVITACION',
  invitacion_enviada_at TIMESTAMP WITH TIME ZONE,
  invitacion_aceptada_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_propietarios_asociacion_usuario
  ON propietarios(asociacion_id, usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_propietarios_asociacion_email
  ON propietarios(asociacion_id, lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_propietarios_membresia
  ON propietarios(membresia_id)
  WHERE membresia_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS fiscales (
  id SERIAL PRIMARY KEY,
  asociacion_id INTEGER NOT NULL REFERENCES asociaciones(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  membresia_id INTEGER REFERENCES membresias(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email VARCHAR(255) NOT NULL,
  telefono TEXT,
  rif_cedula TEXT,
  direccion TEXT,
  punto_control TEXT,
  estado_invitacion TEXT NOT NULL DEFAULT 'PENDIENTE_INVITACION',
  invitacion_enviada_at TIMESTAMP WITH TIME ZONE,
  invitacion_aceptada_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscales_asociacion_usuario
  ON fiscales(asociacion_id, usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscales_asociacion_email
  ON fiscales(asociacion_id, lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscales_membresia
  ON fiscales(membresia_id)
  WHERE membresia_id IS NOT NULL;

INSERT INTO propietarios (
  asociacion_id,
  usuario_id,
  membresia_id,
  nombre,
  apellido,
  email,
  telefono,
  rif_cedula,
  direccion,
  estado_invitacion,
  invitacion_aceptada_at,
  created_at,
  updated_at
)
SELECT
  m.asociacion_id,
  u.id,
  m.id,
  u.nombre,
  u.apellido,
  u.email,
  u.telefono,
  u.rif_cedula,
  u.direccion,
  'ACEPTADA',
  NOW(),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM membresias m
JOIN usuarios u ON u.id = m.usuario_id
WHERE m.rol = 'PROPIETARIO'
ON CONFLICT (asociacion_id, usuario_id) DO UPDATE
SET membresia_id = EXCLUDED.membresia_id,
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    email = EXCLUDED.email,
    telefono = EXCLUDED.telefono,
    rif_cedula = EXCLUDED.rif_cedula,
    direccion = EXCLUDED.direccion,
    estado_invitacion = 'ACEPTADA',
    invitacion_aceptada_at = COALESCE(propietarios.invitacion_aceptada_at, NOW()),
    updated_at = NOW();

INSERT INTO fiscales (
  asociacion_id,
  usuario_id,
  membresia_id,
  nombre,
  apellido,
  email,
  telefono,
  rif_cedula,
  direccion,
  estado_invitacion,
  invitacion_aceptada_at,
  created_at,
  updated_at
)
SELECT
  m.asociacion_id,
  u.id,
  m.id,
  u.nombre,
  u.apellido,
  u.email,
  u.telefono,
  u.rif_cedula,
  u.direccion,
  'ACEPTADA',
  NOW(),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM membresias m
JOIN usuarios u ON u.id = m.usuario_id
WHERE m.rol = 'FISCAL'
ON CONFLICT (asociacion_id, usuario_id) DO UPDATE
SET membresia_id = EXCLUDED.membresia_id,
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    email = EXCLUDED.email,
    telefono = EXCLUDED.telefono,
    rif_cedula = EXCLUDED.rif_cedula,
    direccion = EXCLUDED.direccion,
    estado_invitacion = 'ACEPTADA',
    invitacion_aceptada_at = COALESCE(fiscales.invitacion_aceptada_at, NOW()),
    updated_at = NOW();
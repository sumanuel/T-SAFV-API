-- Idempotent initial schema for T-SAFV
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  rif_cedula TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asociaciones (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  rif TEXT UNIQUE,
  direccion_fiscal TEXT,
  email TEXT,
  telefonos TEXT,
  logo_data TEXT,
  redes_sociales JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creada_por INTEGER
);

CREATE TABLE IF NOT EXISTS unidades_transporte (
  id SERIAL PRIMARY KEY,
  asociacion_id INTEGER NOT NULL,
  propietario_id INTEGER NOT NULL REFERENCES usuarios(id),
  placa TEXT NOT NULL,
  numero_unidad TEXT,
  numero_puestos INTEGER,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (asociacion_id, placa)
);

CREATE TABLE IF NOT EXISTS membresias (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  asociacion_id INTEGER NOT NULL,
  rol TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitaciones (
  id SERIAL PRIMARY KEY,
  asociacion_id INTEGER NOT NULL,
  email_invitado TEXT NOT NULL,
  rol_invitado TEXT NOT NULL,
  token_invitacion TEXT NOT NULL,
  estado TEXT DEFAULT 'PENDIENTE',
  creada_por INTEGER,
  expira_en TIMESTAMP WITH TIME ZONE,
  aceptada_en TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historial_estados (
  id SERIAL PRIMARY KEY,
  entidad_id INTEGER NOT NULL,
  entidad_tipo TEXT NOT NULL,
  estado TEXT NOT NULL,
  motivo TEXT,
  cambiado_por_usuario_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS apellido TEXT;

ALTER TABLE asociaciones
  ADD COLUMN IF NOT EXISTS logo_data TEXT,
  ADD COLUMN IF NOT EXISTS habilitada BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE unidades_transporte
  ADD COLUMN IF NOT EXISTS numero_unidad TEXT,
  ADD COLUMN IF NOT EXISTS numero_puestos INTEGER,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS uso TEXT,
  ADD COLUMN IF NOT EXISTS capacidad TEXT,
  ADD COLUMN IF NOT EXISTS serial_carroceria TEXT,
  ADD COLUMN IF NOT EXISTS serial_motor TEXT,
  ADD COLUMN IF NOT EXISTS numero_cilindros INTEGER,
  ADD COLUMN IF NOT EXISTS peso TEXT,
  ADD COLUMN IF NOT EXISTS numero_poliza_rcv TEXT,
  ADD COLUMN IF NOT EXISTS numero_placa_asignada TEXT,
  ADD COLUMN IF NOT EXISTS fecha_emision DATE,
  ADD COLUMN IF NOT EXISTS chofer TEXT;

CREATE TABLE IF NOT EXISTS asociacion_pagos (
  id SERIAL PRIMARY KEY,
  asociacion_id INTEGER NOT NULL REFERENCES asociaciones(id) ON DELETE CASCADE,
  monto NUMERIC(12, 2),
  moneda TEXT DEFAULT 'USD',
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referencia TEXT,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  registrado_por_usuario_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asociacion_pagos_asociacion
  ON asociacion_pagos(asociacion_id);
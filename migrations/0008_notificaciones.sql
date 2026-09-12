-- Migración 0008: notificaciones persistentes (campana de la app)

CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    tipo VARCHAR(50) NOT NULL DEFAULT 'general',
    titulo VARCHAR(255) NOT NULL,
    cuerpo TEXT,
    data JSONB,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_created
  ON notificaciones(usuario_id, created_at DESC);

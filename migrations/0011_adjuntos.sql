-- Migración 0011: fotos adjuntas (pasajeros en fiscalizaciones y evidencia de incidencias).
-- Los bytes viven en una tabla aparte para que los listados nunca los carguen.
-- `contenido` pasa a NULL cuando una foto se purga por la política de retención.

CREATE TABLE IF NOT EXISTS adjuntos (
    id BIGSERIAL PRIMARY KEY,
    entidad_tipo VARCHAR(20) NOT NULL CHECK (entidad_tipo IN ('REGISTRO', 'INCIDENCIA')),
    entidad_id BIGINT NOT NULL,
    mime VARCHAR(50) NOT NULL,
    bytes INT NOT NULL,
    sha256 CHAR(64) NOT NULL,
    contenido BYTEA,
    subido_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    purgado_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_adjuntos_entidad
  ON adjuntos(entidad_tipo, entidad_id);

-- Una fiscalizacion admite una sola foto.
CREATE UNIQUE INDEX IF NOT EXISTS uq_adjuntos_un_registro
  ON adjuntos(entidad_id)
  WHERE entidad_tipo = 'REGISTRO';

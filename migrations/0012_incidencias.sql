-- Migración 0012: incidencias (infracciones u otros eventos fuera de una fiscalización).

CREATE TABLE IF NOT EXISTS incidencias (
    id BIGSERIAL PRIMARY KEY,
    asociacion_id INT NOT NULL REFERENCES asociaciones(id) ON DELETE CASCADE,
    unidad_id INT REFERENCES unidades_transporte(id),
    registro_id BIGINT REFERENCES registros_fiscalizacion(id),
    tipo VARCHAR(30) NOT NULL,
    descripcion TEXT NOT NULL,
    lugar VARCHAR(255),
    fecha_hora_evento TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA'
      CHECK (estado IN ('ABIERTA', 'EN_REVISION', 'CERRADA')),
    reportada_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    cerrada_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    cerrada_at TIMESTAMP WITH TIME ZONE,
    client_request_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidencias_asociacion_estado
  ON incidencias(asociacion_id, estado, fecha_hora_evento DESC);

CREATE INDEX IF NOT EXISTS idx_incidencias_unidad
  ON incidencias(unidad_id);

-- Un reintento con el mismo client_request_id no duplica la incidencia.
CREATE UNIQUE INDEX IF NOT EXISTS uq_incidencias_client_request
  ON incidencias(reportada_por, client_request_id)
  WHERE client_request_id IS NOT NULL;

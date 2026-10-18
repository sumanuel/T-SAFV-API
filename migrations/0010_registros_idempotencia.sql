-- Migración 0010: idempotencia de registros de fiscalización.
-- La app puede guardar un registro sin conexión y reenviarlo después; con un
-- identificador generado por el cliente, un reintento (p. ej. la respuesta se
-- perdió) no crea un registro ni una notificación duplicados.

ALTER TABLE registros_fiscalizacion
  ADD COLUMN IF NOT EXISTS client_request_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_registros_fiscal_client_request
  ON registros_fiscalizacion (fiscal_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

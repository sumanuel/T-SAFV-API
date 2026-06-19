-- =================================================================
-- Inserción de datos de ejemplo para T-SAFV
-- =================================================================

-- Conéctate a la base de datos "t-safv-db" antes de ejecutar el resto del script.
-- \c "t-safv-db"

-- 1. Crear Usuarios
-- Contraseña para todos: 'password123' (hasheada sería diferente en la BD real)
INSERT INTO usuarios (nombre, email, password, telefono, rif_cedula, direccion) VALUES
('Admin General', 'admin@asotranca.com', '$2a$10$abcdefghijklmnopqrstuv', '0412-1111111', 'J-12345678-1', 'Dirección Admin'),
('Propietario Uno', 'prop1@email.com', '$2a$10$abcdefghijklmnopqrstuv', '0412-2222222', 'V-11222333', 'Dirección Prop 1'),
('Propietario Dos', 'prop2@email.com', '$2a$10$abcdefghijklmnopqrstuv', '0412-3333333', 'V-22333444', 'Dirección Prop 2'),
('Fiscal Uno', 'fiscal1@email.com', '$2a$10$abcdefghijklmnopqrstuv', '0412-4444444', 'V-33444555', 'Dirección Fiscal 1');

-- 2. Crear Asociación
INSERT INTO asociaciones (nombre, rif, direccion_fiscal, email, telefonos, creada_por) VALUES
('Asociación de Transportistas CA', 'J-98765432-1', 'Av. Principal, Ciudad', 'contacto@asotranca.com', '0212-5555555', 1);

-- 3. Crear Membresías
INSERT INTO membresias (usuario_id, asociacion_id, rol) VALUES
(1, 1, 'ADMIN'),
(2, 1, 'PROPIETARIO'),
(3, 1, 'PROPIETARIO'),
(4, 1, 'FISCAL');

-- 4. Crear Unidades de Transporte
INSERT INTO unidades_transporte (asociacion_id, propietario_id, placa, marca, modelo, ano) VALUES
(1, 2, 'AB123CD', 'Toyota', 'Corolla', 2020),
(1, 2, 'XY789ZT', 'Ford', 'Fiesta', 2018),
(1, 3, 'MN456OP', 'Chevrolet', 'Aveo', 2019);

-- 5. Registrar estado inicial de las membresías y unidades
-- Todas las membresías inician como 'ACTIVO'
INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id)
SELECT id, 'MEMBRESIA', 'ACTIVO', 'Creación inicial', 1 FROM membresias;

-- Todas las unidades inician como 'ACTIVO'
INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id)
SELECT id, 'UNIDAD', 'ACTIVO', 'Creación inicial', 1 FROM unidades_transporte;

-- Ejemplo de cambio de estado: suspender una unidad
INSERT INTO historial_estados (entidad_id, entidad_tipo, estado, motivo, cambiado_por_usuario_id) VALUES
(2, 'UNIDAD', 'SUSPENDIDO', 'Falta de pago de cuota', 1);

-- 6. Crear Registros de Fiscalización (ejemplos)
-- Registros para la unidad 1 (placa AB123CD)
INSERT INTO registros_fiscalizacion (unidad_id, fiscal_id, asociacion_id, chofer, destino, pasajeros, fecha_hora_registro) VALUES
(1, 4, 1, 'Carlos Pérez', 'Centro', 4, NOW() - INTERVAL '2 hours'),
(1, 4, 1, 'Carlos Pérez', 'Terminal', 5, NOW() - INTERVAL '1 hour');

-- Registros para la unidad 3 (placa MN456OP)
INSERT INTO registros_fiscalizacion (unidad_id, fiscal_id, asociacion_id, chofer, destino, pasajeros, fecha_hora_registro) VALUES
(3, 4, 1, 'Ana Gómez', 'Norte', 3, NOW() - INTERVAL '30 minutes');

-- Nota sobre contraseñas:
-- El hash '$2a$10$abcdefghijklmnopqrstuv' es solo un placeholder.
-- En una implementación real, la API generaría un hash único para cada contraseña.
-- Para probar el login, necesitarías registrar un usuario desde la API para obtener un hash válido.

-- Fin del script de ejemplo

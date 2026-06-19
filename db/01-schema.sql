-- =================================================================
-- 00. Creación de la Base de Datos y Tipos de Datos
-- =================================================================

-- Descomenta la siguiente línea si necesitas crear la base de datos.
-- CREATE DATABASE "t-safv-db";

-- Conéctate a la base de datos "t-safv-db" antes de ejecutar el resto del script.
-- \c "t-safv-db"

-- Eliminación de tipos y tablas si existen para una recreación limpia
DROP TABLE IF EXISTS registros_fiscalizacion, historial_estados, unidades_transporte, invitaciones, membresias, asociaciones, usuarios CASCADE;
DROP TYPE IF EXISTS rol_membresia, estado_invitacion, estado_entidad, tipo_entidad;

-- Creación de tipos de datos (ENUMS) para roles y estados
CREATE TYPE rol_membresia AS ENUM ('ADMIN', 'FISCAL', 'PROPIETARIO');
CREATE TYPE estado_invitacion AS ENUM ('PENDIENTE', 'ACEPTADA', 'EXPIRADA', 'REVOCADA');
CREATE TYPE estado_entidad AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');
CREATE TYPE tipo_entidad AS ENUM ('UNIDAD', 'MEMBRESIA');

-- =================================================================
-- 01. Tabla de Usuarios
-- =================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    rif_cedula VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Almacena la información de todos los usuarios del sistema.';

-- =================================================================
-- 02. Tabla de Asociaciones
-- =================================================================
CREATE TABLE asociaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rif VARCHAR(20) UNIQUE NOT NULL,
    direccion_fiscal TEXT,
    email VARCHAR(255),
    telefonos VARCHAR(255),
    logo_url TEXT,
    redes_sociales JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creada_por INT REFERENCES usuarios(id)
);

COMMENT ON TABLE asociaciones IS 'Datos principales de cada asociación civil.';

-- =================================================================
-- 03. Tabla de Membresías (Relación Usuario-Asociación)
-- =================================================================
CREATE TABLE membresias (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asociacion_id INT NOT NULL REFERENCES asociaciones(id) ON DELETE CASCADE,
    rol rol_membresia NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (usuario_id, asociacion_id)
);

COMMENT ON TABLE membresias IS 'Define el rol de un usuario dentro de una asociación. El estado se gestiona en historial_estados.';

-- =================================================================
-- 04. Tabla de Invitaciones
-- =================================================================
CREATE TABLE invitaciones (
    id SERIAL PRIMARY KEY,
    asociacion_id INT NOT NULL REFERENCES asociaciones(id),
    email_invitado VARCHAR(255) NOT NULL,
    rol_invitado rol_membresia NOT NULL,
    token_invitacion VARCHAR(255) UNIQUE NOT NULL,
    estado estado_invitacion NOT NULL DEFAULT 'PENDIENTE',
    creada_por INT NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP WITH TIME ZONE,
    aceptada_en TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE invitaciones IS 'Gestiona las invitaciones para unirse a una asociación.';

-- =================================================================
-- 05. Tabla de Unidades de Transporte
-- =================================================================
CREATE TABLE unidades_transporte (
    id SERIAL PRIMARY KEY,
    asociacion_id INT NOT NULL REFERENCES asociaciones(id),
    propietario_id INT NOT NULL REFERENCES usuarios(id),
    placa VARCHAR(15) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    ano INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (asociacion_id, placa)
);

COMMENT ON TABLE unidades_transporte IS 'Vehículos registrados por los propietarios. El estado se gestiona en historial_estados.';

-- =================================================================
-- 06. Tabla de Historial de Estados
-- =================================================================
CREATE TABLE historial_estados (
    id BIGSERIAL PRIMARY KEY,
    entidad_id INT NOT NULL,
    entidad_tipo tipo_entidad NOT NULL,
    estado estado_entidad NOT NULL,
    motivo TEXT,
    cambiado_por_usuario_id INT NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE historial_estados IS 'Trazabilidad de todos los cambios de estado para unidades y membresías.';

-- =================================================================
-- 07. Tabla de Registros de Fiscalización
-- =================================================================
CREATE TABLE registros_fiscalizacion (
    id BIGSERIAL PRIMARY KEY,
    unidad_id INT NOT NULL REFERENCES unidades_transporte(id),
    fiscal_id INT NOT NULL REFERENCES usuarios(id),
    asociacion_id INT NOT NULL REFERENCES asociaciones(id),
    chofer VARCHAR(255),
    destino VARCHAR(255),
    pasajeros INT,
    fecha_hora_registro TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE registros_fiscalizacion IS 'Trazabilidad de los movimientos registrados por los fiscales.';

-- =================================================================
-- Índices para optimizar consultas
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_membresias_usuario_asociacion ON membresias(usuario_id, asociacion_id);
CREATE INDEX IF NOT EXISTS idx_unidades_propietario ON unidades_transporte(propietario_id);
CREATE INDEX IF NOT EXISTS idx_historial_estados_entidad ON historial_estados(entidad_id, entidad_tipo);
CREATE INDEX IF NOT EXISTS idx_registros_unidad_fecha ON registros_fiscalizacion(unidad_id, fecha_hora_registro DESC);
CREATE INDEX IF NOT EXISTS idx_registros_asociacion_fecha ON registros_fiscalizacion(asociacion_id, fecha_hora_registro DESC);

-- Fin del script

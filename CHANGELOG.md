# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-06-19

### Added

- **Registro de nuevas rutas**: Se registran en `index.js` las rutas para invitaciones, propietario, fiscal y export (`/api/invitaciones`, `/api/propietario`, `/api/fiscal`, `/api/export`).
- **Módulos completos**: Se añaden `invitacionModel`, `invitacionController`, `invitacionRoutes`, `propietarioModel`, `propietarioController`, `propietarioRoutes`, `fiscalModel`, `fiscalController`, `fiscalRoutes`, `exportModel`, `exportController`, `exportRoutes`.
- **Soporte para exportación Excel**: Implementación inicial de exportación a Excel usando `exceljs` (exportar miembros, unidades y trazabilidad).

### Changed

- **`authMiddleware`**: Se amplía con verificadores de rol basados en BD: `isAsociacionAdmin`, `isPropietario`, `isFiscal`.

### Security / Config

- **DB SSL config**: `PGSSL` ahora es `true` por defecto y la configuración puede usar `PG_SSL_ROOT_CERT` para proporcionar un CA PEM. El cliente acepta `PGSSL=false|0|no` para desactivar SSL en desarrollo.

## [0.8.0] - 2026-06-19

### Added

- **Exportación**: Controladores para generar archivos `.xlsx` en memoria y enviarlos como attachment.

## [0.7.0] - 2026-06-19

### Added

- **Fiscalizaciones**: Endpoints para listar unidades activas por asociación y crear registros de fiscalización (`registros_fiscalizacion`).

## [0.6.0] - 2026-06-19

### Added

- **Propietarios**: Endpoints para que un propietario liste sus unidades y consulte la trazabilidad de una unidad.

## [0.5.0] - 2026-06-19

### Added

- **Sistema de Invitaciones**: Modelo y endpoints para crear invitaciones, listar invitaciones pendientes por email y aceptar invitaciones (crea `membresia` y entrada en `historial_estados`).

## [0.4.0] - 2026-06-19

### Added

- **Middlewares de rol por asociación**: Implementación de verificación de rol en asociación respaldada por la tabla `membresias` y `historial_estados`.

## [0.3.0] - 2026-06-19

### Added

- **Gestión de Asociaciones**: Se añade el endpoint `POST /api/asociaciones` para crear una nueva asociación.
- **Membresía Automática**: Al crear una asociación, el usuario creador se convierte automáticamente en miembro con el rol 'ADMIN' y estado 'ACTIVO'.
- **Transacciones de BD**: La creación de la asociación y la membresía del administrador se realizan dentro de una transacción para garantizar la integridad de los datos.
- **Nuevos Módulos**: Se crean `asociacionModel.js`, `asociacionController.js` y `asociacionRoutes.js`.

### Changed

- **`index.js`**: Se integra el nuevo `asociacionRoutes`.

## [0.2.0] - 2026-06-19

### Added

- **Historial de Estados**: Se añade la tabla `historial_estados` para trazabilidad de cambios de estado en unidades y membresías.
- **Rutas de Unidades**: Se crean endpoints para crear unidades y para cambiar su estado (`/api/unidades` y `/api/unidades/:unidad_id/state`).
- **Middleware de Autenticación**: Se añade `authMiddleware` para proteger rutas y `isAdmin` para rutas exclusivas de administradores.
- **Modelos y Controladores**: Se crean `unidadModel`, `historyModel`, `unidadController` para manejar la nueva lógica.

### Changed

- **Modelo de Datos**: Se eliminan las columnas de estado de las tablas `unidades_transporte` y `membresias`. La gestión de estado ahora es centralizada.
- **Creación de Unidades**: El proceso ahora ocurre en una transacción de base de datos para crear la unidad y su estado inicial 'ACTIVO' de forma atómica.
- **`index.js`**: Se integra el nuevo `unidadRoutes`.

## [0.1.0] - 2026-06-08

### Added

- **Proyecto Inicial**: Creación del proyecto base con Express.
- **Autenticación**: Endpoints para registro (`/api/auth/register`) y login (`/api/auth/login`) de usuarios.
- **Estructura de carpetas**: `src`, `controllers`, `models`, `routes`, `config`.
- **Dependencias**: `express`, `cors`, `dotenv`, `pg`, `bcryptjs`, `jsonwebtoken`.
- **Script de BD**: Creación inicial de la tabla `usuarios`.

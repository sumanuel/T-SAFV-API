# Arquitectura: T-SAFV-API

Última actualización: 2026-07-30

## Resumen de arquitectura

T-SAFV-API es un backend REST construido sobre Express que expone servicios de autenticación, asociaciones de transporte, gestión de miembros, unidades vehiculares, fiscalización, propietarios y exportación de datos. Utiliza PostgreSQL como base de datos principal y autenticación basada en JWT.

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Clients                         │
│                 (T-SAFV-App-V, Postman, etc.)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Security Layer                                        │  │
│  │ • helmet (HTTP headers)                              │  │
│  │ • CORS                                               │  │
│  │ • Rate limiting (100 req/15min)                      │  │
│  │ • Input sanitization                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │ Routes Layer            │                            │  │
│  │ /api/auth               │                            │  │
│  │ /api/asociaciones       │                            │  │
│  │ /api/unidades           │                            │  │
│  │ /api/invitaciones       │                            │  │
│  │ /api/propietario        │                            │  │
│  │ /api/fiscal             │                            │  │
│  │ /api/export             │                            │  │
│  │ /api (membresías)       │                            │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │ Middleware Layer        │                            │  │
│  │ • authMiddleware (JWT verification)                  │  │
│  │ • associationMiddleware (membership checks)          │  │
│  │ • roleMiddleware (permission checks)                 │  │
│  │ • errorHandler (centralized error handling)          │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │ Controllers Layer       │                            │  │
│  │ • authController                                     │  │
│  │ • asociacionController                               │  │
│  │ • unidadController                                   │  │
│  │ • invitacionController                               │  │
│  │ • propietarioController                              │  │
│  │ • fiscalController                                   │  │
│  │ • exportController                                   │  │
│  │ • membresiaController                                │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │ Models/Services Layer   │                            │  │
│  │ • User model                                         │  │
│  │ • Asociacion model                                   │  │
│  │ • Unidad model                                       │  │
│  │ • Invitacion model                                   │  │
│  │ • Fiscal/Propietario models                          │  │
│  │ • Export services (Excel generation)                 │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │ Database Layer          │                            │  │
│  │ • PostgreSQL connection pool                         │  │
│  │ • Query builders                                     │  │
│  │ • Migrations                                         │  │
│  └─────────────────────────┼────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   PostgreSQL DB      │
                  │   • usuarios         │
                  │   • asociaciones     │
                  │   • membresias       │
                  │   • invitaciones     │
                  │   • unidades         │
                  │   • propietarios     │
                  │   • fiscales         │
                  │   • registros_fiscal │
                  └──────────────────────┘
```

## Estructura de directorios

```
T-SAFV-API/
├── index.js                      # Punto de entrada, configuración de Express
├── src/
│   ├── config/
│   │   └── database.js           # Configuración de conexión PostgreSQL
│   ├── routes/
│   │   ├── authRoutes.js         # Rutas de autenticación
│   │   ├── asociacionRoutes.js   # CRUD de asociaciones
│   │   ├── unidadRoutes.js       # CRUD de unidades vehiculares
│   │   ├── invitacionRoutes.js   # Gestión de invitaciones
│   │   ├── propietarioRoutes.js  # Gestión de propietarios
│   │   ├── fiscalRoutes.js       # Registros de fiscalización
│   │   ├── exportRoutes.js       # Exportación de datos
│   │   └── membresiaRoutes.js    # Gestión de membresías
│   ├── controllers/
│   │   ├── authController.js     # Lógica de login/register
│   │   ├── asociacionController.js
│   │   ├── unidadController.js
│   │   ├── invitacionController.js
│   │   ├── propietarioController.js
│   │   ├── fiscalController.js
│   │   ├── exportController.js
│   │   └── membresiaController.js
│   ├── models/
│   │   ├── User.js               # Modelo de usuario
│   │   ├── Asociacion.js         # Modelo de asociación
│   │   ├── Unidad.js             # Modelo de unidad
│   │   ├── Invitacion.js         # Modelo de invitación
│   │   ├── Propietario.js
│   │   ├── Fiscal.js
│   │   └── ...
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Verificación de JWT
│   │   ├── sanitize.js           # Sanitización de inputs
│   │   └── errorHandler.js       # Manejador central de errores
│   └── services/
│       └── exportService.js      # Generación de Excel
├── migrations/                   # Scripts de migración de DB
├── tests/                        # Tests de integración
│   ├── root.test.js
│   └── integration/
├── docs/                         # Documentación API
│   ├── openapi.json              # Especificación OpenAPI 3.0
│   └── postman_collection.json   # Colección Postman
├── CONTEXTO_PROYECTO.md
├── ARRANQUE_RAPIDO.md
├── MATRIZ_APP_BACKEND.md
├── CHANGELOG.md
└── database.sql                  # Schema SQL inicial
```

## Capas y responsabilidades

### 1. Capa de Seguridad

**Responsabilidad**: Proteger la aplicación de ataques comunes y limitar el uso de recursos.

**Componentes**:

- `helmet`: Configura headers HTTP seguros (CSP, X-Frame-Options, etc.)
- `cors`: Control de Cross-Origin Resource Sharing
- `express-rate-limit`: Limita a 100 requests por IP cada 15 minutos
- `sanitize middleware`: Limpia inputs para prevenir inyecciones

### 2. Capa de Rutas

**Responsabilidad**: Enrutar peticiones HTTP a los controladores correspondientes.

**Patrón**: Cada módulo funcional tiene su archivo de rutas dedicado.

**Ejemplo**:

```js
// authRoutes.js
router.post("/register", authController.register);
router.post("/login", authController.login);
```

### 3. Capa de Middlewares

**Responsabilidad**: Validar autenticación, permisos y contexto antes de ejecutar controladores.

**Middlewares principales**:

- **authMiddleware**: Verifica token JWT y adjunta `req.user`
- **associationMiddleware**: Valida membresía en asociación específica
- **roleMiddleware**: Verifica roles específicos (ADMIN, PROPIETARIO, FISCAL)
- **errorHandler**: Captura errores y devuelve respuestas estandarizadas

**Flujo de ejemplo**:

```js
router.get(
  "/asociaciones/:id/miembros",
  authMiddleware,
  associationMiddleware,
  asociacionController.getMembers,
);
```

### 4. Capa de Controladores

**Responsabilidad**: Orquestar la lógica de negocio, validar inputs, llamar a modelos y retornar respuestas HTTP.

**Patrón**:

```js
async function createAsociacion(req, res, next) {
  try {
    // 1. Validar inputs
    const { nombre, rif } = req.body;

    // 2. Llamar al modelo
    const nuevaAsociacion = await Asociacion.create(nombre, rif, req.user.id);

    // 3. Retornar respuesta
    res.status(201).json(nuevaAsociacion);
  } catch (error) {
    next(error);
  }
}
```

### 5. Capa de Modelos

**Responsabilidad**: Acceso directo a la base de datos, encapsulación de queries SQL.

**Patrón**:

```js
class Asociacion {
  static async create(nombre, rif, creadorId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insertar asociación
      const result = await client.query(
        "INSERT INTO asociaciones (nombre, rif) VALUES ($1, $2) RETURNING *",
        [nombre, rif],
      );

      // Crear membresía automática para el creador
      await client.query(
        "INSERT INTO membresias (usuario_id, asociacion_id, rol) VALUES ($1, $2, 'ADMIN')",
        [creadorId, result.rows[0].id],
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### 6. Capa de Base de Datos

**Responsabilidad**: Conexión y pooling de PostgreSQL.

**Configuración** (`src/config/database.js`):

```js
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL !== "false" ? { rejectUnauthorized: false } : false,
});
```

## Modelo de datos principal

### Tablas core

```sql
usuarios
  ├── id (PK)
  ├── nombre
  ├── email (unique)
  ├── password_hash
  └── created_at

asociaciones
  ├── id (PK)
  ├── nombre
  ├── rif
  ├── logo (base64)
  ├── estado_licencia
  └── created_at

membresias
  ├── id (PK)
  ├── usuario_id (FK → usuarios)
  ├── asociacion_id (FK → asociaciones)
  ├── rol (ADMIN | PROPIETARIO | FISCAL)
  └── estado (ACTIVO | INACTIVO | SUSPENDIDO)

unidades
  ├── id (PK)
  ├── asociacion_id (FK → asociaciones)
  ├── propietario_id (FK → usuarios)
  ├── placa
  ├── numero_unidad
  ├── numero_puestos
  └── created_at

invitaciones
  ├── id (PK)
  ├── asociacion_id (FK → asociaciones)
  ├── email_invitado
  ├── rol_invitado
  ├── token (unique)
  ├── estado (PENDIENTE | ACEPTADA | RECHAZADA)
  └── created_at

registros_fiscal
  ├── id (PK)
  ├── unidad_id (FK → unidades)
  ├── fiscal_id (FK → usuarios)
  ├── fecha_registro
  ├── pasajeros
  └── observaciones
```

## Patrones de autenticación y autorización

### Autenticación (JWT)

1. Usuario envía credenciales a `/api/auth/login`
2. Backend valida contra `usuarios` table
3. Si válido, genera JWT con payload:
   ```js
   {
     userId: user.id,
     email: user.email,
     exp: Date.now() + 7 days
   }
   ```
4. Cliente guarda token y lo envía en header `Authorization: Bearer <token>`

### Autorización por rol

**Roles soportados**:

- `ADMIN`: Gestión completa de asociación
- `PROPIETARIO`: Gestión de unidades propias
- `FISCAL`: Registro de fiscalizaciones

**Verificación en middleware**:

```js
// roleMiddleware.js
function requireRole(roles) {
  return (req, res, next) => {
    const membership = req.membership; // Set by associationMiddleware
    if (!roles.includes(membership.rol)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

**Uso**:

```js
router.delete(
  "/asociaciones/:id/miembros/:membresia_id",
  authMiddleware,
  associationMiddleware,
  requireRole(["ADMIN"]),
  asociacionController.removeMember,
);
```

## Flujos críticos

### Flujo: Crear asociación con membresía automática

```
Cliente → POST /api/asociaciones { nombre, rif }
  ↓
authMiddleware: Verifica JWT, adjunta req.user
  ↓
asociacionController.createAsociacion()
  ↓
Asociacion.create(nombre, rif, req.user.id)
  ↓
BEGIN TRANSACTION
  INSERT INTO asociaciones (nombre, rif) RETURNING *
  INSERT INTO membresias (usuario_id, asociacion_id, rol='ADMIN')
COMMIT
  ↓
Retorna asociación creada + status 201
```

### Flujo: Invitar miembro a asociación

```
Admin → POST /api/invitaciones { asociacion_id, email_invitado, rol }
  ↓
authMiddleware + associationMiddleware: Verifica membresía activa
  ↓
requireRole(["ADMIN"]): Verifica que sea admin
  ↓
invitacionController.createInvitation()
  ↓
Invitacion.create(asociacion_id, email, rol)
  INSERT INTO invitaciones (token=UUID, estado='PENDIENTE', ...)
  ↓
Envía email con link de invitación (opcional)
  ↓
Retorna invitación + status 201
```

### Flujo: Registro de fiscalización

```
Fiscal → POST /api/fiscal/registros { unidad_id, pasajeros, observaciones }
  ↓
authMiddleware: Verifica JWT
  ↓
fiscalController.createRecord()
  ↓
Valida que unidad pertenece a asociación del fiscal
  ↓
INSERT INTO registros_fiscal (unidad_id, fiscal_id, fecha_registro, ...)
  ↓
Retorna registro + status 201
```

## Manejo de errores

### Patrón centralizado

Todos los errores se capturan en `errorHandler` middleware:

```js
// errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(500).json({ error: "Internal Server Error" });
};
```

### Errores comunes

| Código | Tipo                  | Cuándo                                 |
| ------ | --------------------- | -------------------------------------- |
| 400    | Bad Request           | Validación de inputs falla             |
| 401    | Unauthorized          | JWT inválido o expirado                |
| 403    | Forbidden             | Usuario sin permisos para la operación |
| 404    | Not Found             | Recurso no existe                      |
| 409    | Conflict              | Duplicado (ej: email ya registrado)    |
| 500    | Internal Server Error | Error inesperado del servidor          |

## Seguridad

### Protecciones implementadas

1. **Inyección SQL**: Uso de queries parametrizadas (`$1`, `$2`)
2. **Rate Limiting**: 100 req/15min por IP
3. **Sanitización**: Middleware limpia inputs HTML/JS
4. **Headers seguros**: Helmet configura CSP, X-Frame-Options
5. **CORS**: Configurado para permitir solo origins autorizados
6. **Tamaño de payload**: Limitado a 12MB (para logos base64)

### Pendientes de seguridad

- [ ] Implementar refresh tokens para JWT
- [ ] Añadir 2FA para roles ADMIN
- [ ] Logging de auditoría para operaciones críticas
- [ ] Encriptación de datos sensibles en reposo
- [ ] Rate limiting por endpoint crítico (login, register)

## Escalabilidad

### Consideraciones actuales

- **Connection pooling**: PostgreSQL pool maneja hasta N conexiones concurrentes
- **Stateless**: JWT permite escalar horizontalmente sin sesiones
- **Rate limiting**: Previene abuso de recursos

### Cuellos de botella potenciales

1. **Exportación Excel**: Generación en memoria puede consumir mucho RAM
2. **Queries sin índices**: Algunas consultas pueden ser lentas con muchos datos
3. **Upload de logos**: Guardar base64 en PostgreSQL puede ser costoso

### Recomendaciones para escalar

- Mover exportación Excel a job queue (ej: Bull/Redis)
- Implementar caché con Redis para queries frecuentes
- Migrar logos a S3/Cloudinary en lugar de base64
- Añadir índices en columnas de búsqueda frecuente

## Testing

### Estrategia actual

- **Unit tests**: No implementados
- **Integration tests**: Básicos en `tests/integration/`
- **Smoke test**: `npm run test` ejecuta suite Jest

### Áreas a testear

- [ ] Autenticación (login, register, JWT)
- [ ] CRUD de asociaciones
- [ ] Invitaciones (crear, aceptar, rechazar)
- [ ] Membresías (roles, permisos)
- [ ] Unidades (crear, actualizar, listar)
- [ ] Registros fiscales

Ver [TESTS_REGRESION.md](./TESTS_REGRESION.md) para suite completa.

## Deployment

### Variables de entorno requeridas

```bash
PORT=3000
JWT_SECRET=<secret>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PGSSL=true
EMAIL_USER=<email>
EMAIL_PASS=<password>
APP_URL=https://app.t-safv.com
```

### Checklist de deployment

1. ✓ Configurar variables de entorno
2. ✓ Ejecutar migraciones: `npm run migrate`
3. ✓ Ejecutar tests: `npm run test`
4. ✓ Iniciar servidor: `npm run start`
5. ✓ Verificar health check: `GET /`
6. ✓ Monitorear logs y errores

## Integración con T-SAFV-App-V

El frontend consume estos endpoints a través de `src/services/api/sdk.js`.

**Contratos críticos** (ver [MATRIZ_APP_BACKEND.md](./MATRIZ_APP_BACKEND.md)):

- `POST /api/auth/login` → Token JWT
- `GET /api/asociaciones/mine` → Asociaciones del usuario
- `GET /api/asociaciones/:id/miembros` → Miembros de asociación
- `POST /api/unidades/asociaciones/:id/unidades` → Crear unidad
- `POST /api/fiscal/registros` → Crear registro fiscal

**Coordinación necesaria**:

- No cambiar enums de estado/rol sin sincronizar con app
- No cambiar validaciones de campos sin actualizar formularios
- Mantener MATRIZ_APP_BACKEND.md actualizada en ambos repos

## Referencias

- [CONTEXTO_PROYECTO.md](./CONTEXTO_PROYECTO.md) - Visión general del proyecto
- [ARRANQUE_RAPIDO.md](./ARRANQUE_RAPIDO.md) - Setup y comandos
- [SPECS.md](./SPECS.md) - Especificaciones funcionales
- [TESTS_REGRESION.md](./TESTS_REGRESION.md) - Suite de tests
- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios

# Especificaciones funcionales: T-SAFV-API

Última actualización: 2026-07-30

## Resumen

Este documento detalla las especificaciones funcionales de T-SAFV-API, el backend del sistema de gestión de asociaciones de transporte. Cada módulo incluye casos de uso, reglas de negocio, validaciones y comportamiento esperado.

## Módulos funcionales

1. [Autenticación](#1-autenticación)
2. [Asociaciones](#2-asociaciones)
3. [Membresías](#3-membresías)
4. [Invitaciones](#4-invitaciones)
5. [Propietarios](#5-propietarios)
6. [Fiscales](#6-fiscales)
7. [Unidades](#7-unidades)
8. [Registros Fiscales](#8-registros-fiscales)
9. [Trazabilidad](#9-trazabilidad)
10. [Exportación](#10-exportación)

---

## 1. Autenticación

### 1.1 Registro de usuario

**Endpoint**: `POST /api/auth/register`

**Caso de uso**: Un nuevo usuario se registra en el sistema.

**Request body**:

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Validaciones**:

- `nombre`: min 2 caracteres, requerido
- `email`: formato email válido, único en sistema, requerido
- `password`: min 8 caracteres, requerido

**Reglas de negocio**:

1. El email debe ser único en el sistema
2. La contraseña se hashea con bcrypt antes de guardar
3. El usuario se crea sin asociación asignada
4. No se genera token automáticamente (debe hacer login)

**Response esperado** (201):

```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Errores**:

- `400`: Validación falla
- `409`: Email ya registrado

---

### 1.2 Login

**Endpoint**: `POST /api/auth/login`

**Caso de uso**: Usuario existente inicia sesión.

**Request body**:

```json
{
  "email": "juan@example.com",
  "password": "SecurePass123"
}
```

**Validaciones**:

- `email`: formato email válido, requerido
- `password`: requerido

**Reglas de negocio**:

1. Verificar que el email existe
2. Comparar password con hash usando bcrypt
3. Generar JWT con expiración de 7 días
4. Payload del token: `{ userId, email, exp }`

**Response esperado** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Errores**:

- `400`: Validación falla
- `401`: Credenciales inválidas

---

## 2. Asociaciones

### 2.1 Crear asociación

**Endpoint**: `POST /api/asociaciones`

**Caso de uso**: Usuario autenticado crea una nueva asociación de transporte.

**Headers requeridos**:

```
Authorization: Bearer <token>
```

**Request body**:

```json
{
  "nombre": "Asociación Trans Carabobo",
  "rif": "J-12345678-9",
  "logo": "data:image/png;base64,..." // Opcional
}
```

**Validaciones**:

- `nombre`: min 3 caracteres, requerido
- `rif`: string, opcional
- `logo`: base64, max 12MB, opcional

**Reglas de negocio**:

1. El usuario autenticado se convierte en ADMIN de la asociación automáticamente
2. Se crea una membresía con `rol='ADMIN'` y `estado='ACTIVO'`
3. El logo se guarda en base64 en PostgreSQL
4. La asociación se crea con `estado_licencia='TRIAL'`

**Response esperado** (201):

```json
{
  "id": 1,
  "nombre": "Asociación Trans Carabobo",
  "rif": "J-12345678-9",
  "logo": "data:image/png;base64,...",
  "estado_licencia": "TRIAL",
  "created_at": "2026-07-30T10:00:00.000Z"
}
```

**Errores**:

- `400`: Validación falla
- `401`: Token inválido

---

### 2.2 Listar mis asociaciones

**Endpoint**: `GET /api/asociaciones/mine`

**Caso de uso**: Usuario lista todas las asociaciones donde tiene membresía activa.

**Headers requeridos**:

```
Authorization: Bearer <token>
```

**Reglas de negocio**:

1. Retorna solo asociaciones donde el usuario tiene membresía
2. Incluye el rol del usuario en cada asociación
3. No retorna asociaciones con membresía INACTIVA o SUSPENDIDA

**Response esperado** (200):

```json
[
  {
    "id": 1,
    "nombre": "Asociación Trans Carabobo",
    "rif": "J-12345678-9",
    "logo": "data:image/png;base64,...",
    "mi_rol": "ADMIN",
    "estado_membresia": "ACTIVO"
  },
  {
    "id": 2,
    "nombre": "Cooperativa Trans Valencia",
    "rif": "J-98765432-1",
    "logo": null,
    "mi_rol": "PROPIETARIO",
    "estado_membresia": "ACTIVO"
  }
]
```

---

### 2.3 Actualizar asociación

**Endpoint**: `PUT /api/asociaciones/:id`

**Caso de uso**: Usuario ADMIN actualiza datos de la asociación.

**Permisos**: Solo ADMIN de la asociación

**Request body**:

```json
{
  "nombre": "Asociación Trans Carabobo C.A.",
  "rif": "J-12345678-9",
  "logo": "data:image/png;base64,..."
}
```

**Reglas de negocio**:

1. Solo usuarios con rol ADMIN pueden actualizar
2. Todos los campos son opcionales
3. Si se envía logo, reemplaza el anterior

**Response esperado** (200):

```json
{
  "id": 1,
  "nombre": "Asociación Trans Carabobo C.A.",
  "rif": "J-12345678-9",
  "logo": "data:image/png;base64,...",
  "estado_licencia": "TRIAL"
}
```

**Errores**:

- `403`: Usuario no es ADMIN
- `404`: Asociación no existe

---

### 2.4 Resumen de asociación

**Endpoint**: `GET /api/asociaciones/:id/resumen`

**Caso de uso**: Obtener métricas operativas de la asociación.

**Permisos**: Miembro activo de la asociación

**Response esperado** (200):

```json
{
  "asociacion_id": 1,
  "total_miembros": 15,
  "total_unidades": 42,
  "total_registros_fiscales": 1250,
  "estado_licencia": "TRIAL",
  "fecha_expiracion_licencia": "2026-12-31"
}
```

---

## 3. Membresías

### 3.1 Listar miembros de asociación

**Endpoint**: `GET /api/asociaciones/:id/miembros`

**Caso de uso**: Listar todos los miembros activos de una asociación.

**Permisos**: Miembro activo de la asociación

**Response esperado** (200):

```json
[
  {
    "membresia_id": 1,
    "usuario_id": 5,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "ADMIN",
    "estado": "ACTIVO",
    "fecha_ingreso": "2026-01-15T10:00:00.000Z"
  },
  {
    "membresia_id": 2,
    "usuario_id": 8,
    "nombre": "María González",
    "email": "maria@example.com",
    "rol": "PROPIETARIO",
    "estado": "ACTIVO",
    "fecha_ingreso": "2026-02-20T14:30:00.000Z"
  }
]
```

---

### 3.2 Crear miembro directo

**Endpoint**: `POST /api/asociaciones/:id/miembros`

**Caso de uso**: Admin crea un miembro directamente sin invitación.

**Permisos**: Solo ADMIN

**Request body**:

```json
{
  "nombre": "Carlos Ruiz",
  "email": "carlos@example.com",
  "password": "SecurePass123",
  "rol": "PROPIETARIO"
}
```

**Validaciones**:

- `nombre`: min 2 caracteres, requerido
- `email`: formato válido, único, requerido
- `password`: min 8 caracteres, requerido
- `rol`: enum (PROPIETARIO | FISCAL), requerido

**Reglas de negocio**:

1. El email debe ser único en el sistema
2. No se puede crear otro ADMIN por esta vía
3. Se crea usuario + membresía en transacción
4. La membresía se crea con estado ACTIVO

**Response esperado** (201):

```json
{
  "membresia_id": 3,
  "usuario_id": 12,
  "nombre": "Carlos Ruiz",
  "email": "carlos@example.com",
  "rol": "PROPIETARIO",
  "estado": "ACTIVO"
}
```

**Errores**:

- `400`: Validación falla
- `403`: Usuario no es ADMIN
- `409`: Email ya registrado

---

### 3.3 Actualizar miembro

**Endpoint**: `PUT /api/asociaciones/:id/miembros/:membresia_id`

**Caso de uso**: Admin actualiza datos de un miembro.

**Permisos**: Solo ADMIN

**Request body**:

```json
{
  "nombre": "Carlos Alberto Ruiz",
  "email": "carlos.ruiz@example.com",
  "password": "NewPassword456", // Opcional
  "rol": "FISCAL"
}
```

**Reglas de negocio**:

1. Solo ADMIN puede actualizar
2. No se puede cambiar el rol del creador de la asociación
3. Si se envía password, se hashea y actualiza
4. Nombre, email y rol son opcionales

**Errores**:

- `403`: Usuario no es ADMIN
- `404`: Membresía no existe

---

### 3.4 Cambiar estado de membresía

**Endpoint**: `POST /api/asociaciones/:id/membresias/:membresia_id/state`

**Caso de uso**: Admin activa/suspende/desactiva un miembro.

**Permisos**: Solo ADMIN

**Request body**:

```json
{
  "estado": "SUSPENDIDO"
}
```

**Validaciones**:

- `estado`: enum (ACTIVO | INACTIVO | SUSPENDIDO), requerido

**Reglas de negocio**:

1. No se puede desactivar al creador de la asociación
2. SUSPENDIDO impide login temporal
3. INACTIVO impide acceso permanente

**Response esperado** (200):

```json
{
  "membresia_id": 3,
  "usuario_id": 12,
  "estado": "SUSPENDIDO"
}
```

---

## 4. Invitaciones

### 4.1 Crear invitación

**Endpoint**: `POST /api/invitaciones`

**Caso de uso**: Admin invita a un usuario externo a unirse a la asociación.

**Permisos**: Solo ADMIN

**Request body**:

```json
{
  "asociacion_id": 1,
  "email_invitado": "nuevo@example.com",
  "rol_invitado": "PROPIETARIO"
}
```

**Validaciones**:

- `asociacion_id`: int, requerido
- `email_invitado`: formato email, requerido
- `rol_invitado`: enum (PROPIETARIO | FISCAL), requerido

**Reglas de negocio**:

1. Se genera un token UUID único
2. La invitación se crea con estado PENDIENTE
3. Se puede enviar email con link de invitación (opcional)
4. El token expira después de 7 días

**Response esperado** (201):

```json
{
  "invitacion_id": 5,
  "asociacion_id": 1,
  "email_invitado": "nuevo@example.com",
  "rol_invitado": "PROPIETARIO",
  "token": "a3f4b8c2-1234-5678-90ab-cdef12345678",
  "estado": "PENDIENTE",
  "created_at": "2026-07-30T10:00:00.000Z"
}
```

**Errores**:

- `403`: Usuario no es ADMIN
- `409`: Ya existe invitación pendiente para ese email

---

### 4.2 Listar invitaciones de asociación

**Endpoint**: `GET /api/invitaciones/asociacion/:id`

**Caso de uso**: Admin lista todas las invitaciones enviadas.

**Permisos**: Solo ADMIN

**Response esperado** (200):

```json
[
  {
    "invitacion_id": 5,
    "email_invitado": "nuevo@example.com",
    "rol_invitado": "PROPIETARIO",
    "estado": "PENDIENTE",
    "created_at": "2026-07-30T10:00:00.000Z"
  },
  {
    "invitacion_id": 4,
    "email_invitado": "otro@example.com",
    "rol_invitado": "FISCAL",
    "estado": "ACEPTADA",
    "created_at": "2026-07-25T08:15:00.000Z",
    "accepted_at": "2026-07-26T09:30:00.000Z"
  }
]
```

---

### 4.3 Aceptar invitación

**Endpoint**: `POST /api/invitaciones/:token/aceptar`

**Caso de uso**: Usuario registrado acepta invitación y se une a asociación.

**Permisos**: Usuario autenticado

**Request body**: Vacío (el token va en URL)

**Reglas de negocio**:

1. El email del usuario autenticado debe coincidir con `email_invitado`
2. La invitación debe estar en estado PENDIENTE
3. El token no debe estar expirado
4. Se crea membresía con el rol especificado en la invitación
5. La invitación cambia a estado ACEPTADA

**Response esperado** (200):

```json
{
  "message": "Invitación aceptada exitosamente",
  "membresia": {
    "membresia_id": 6,
    "asociacion_id": 1,
    "rol": "PROPIETARIO",
    "estado": "ACTIVO"
  }
}
```

**Errores**:

- `400`: Email no coincide
- `404`: Token inválido o expirado
- `409`: Usuario ya es miembro de la asociación

---

### 4.4 Rechazar invitación

**Endpoint**: `POST /api/invitaciones/:token/rechazar`

**Caso de uso**: Usuario rechaza invitación.

**Reglas de negocio**:

1. La invitación cambia a estado RECHAZADA
2. No se crea membresía

**Response esperado** (200):

```json
{
  "message": "Invitación rechazada"
}
```

---

## 5. Propietarios

### 5.1 Listar propietarios de asociación

**Endpoint**: `GET /api/propietario/asociacion/:id`

**Caso de uso**: Listar todos los usuarios con rol PROPIETARIO en la asociación.

**Permisos**: Miembro activo

**Response esperado** (200):

```json
[
  {
    "propietario_id": 8,
    "nombre": "María González",
    "email": "maria@example.com",
    "estado": "ACTIVO",
    "total_unidades": 3
  },
  {
    "propietario_id": 12,
    "nombre": "Carlos Ruiz",
    "email": "carlos@example.com",
    "estado": "ACTIVO",
    "total_unidades": 1
  }
]
```

---

## 6. Fiscales

### 6.1 Listar fiscales de asociación

**Endpoint**: `GET /api/fiscal/asociacion/:id`

**Caso de uso**: Listar todos los usuarios con rol FISCAL en la asociación.

**Permisos**: Miembro activo

**Response esperado** (200):

```json
[
  {
    "fiscal_id": 15,
    "nombre": "Pedro Martínez",
    "email": "pedro@example.com",
    "estado": "ACTIVO",
    "total_registros": 245
  }
]
```

---

## 7. Unidades

### 7.1 Crear unidad

**Endpoint**: `POST /api/unidades/asociaciones/:id/unidades`

**Caso de uso**: Crear una nueva unidad vehicular en la asociación.

**Permisos**: ADMIN o PROPIETARIO

**Request body**:

```json
{
  "propietario_id": 8,
  "placa": "ABC-123",
  "numero_unidad": "U-042",
  "numero_puestos": 35,
  "modelo": "Mercedes-Benz 2018",
  "color": "Blanco"
}
```

**Validaciones**:

- `propietario_id`: int, requerido, debe ser PROPIETARIO en la asociación
- `placa`: string, requerido
- `numero_unidad`: string, requerido, único en asociación
- `numero_puestos`: int, requerido
- `modelo`: string, opcional
- `color`: string, opcional

**Reglas de negocio**:

1. El propietario debe ser miembro activo con rol PROPIETARIO
2. `numero_unidad` debe ser único dentro de la asociación
3. La placa debe tener formato válido

**Response esperado** (201):

```json
{
  "unidad_id": 10,
  "asociacion_id": 1,
  "propietario_id": 8,
  "placa": "ABC-123",
  "numero_unidad": "U-042",
  "numero_puestos": 35,
  "modelo": "Mercedes-Benz 2018",
  "color": "Blanco",
  "created_at": "2026-07-30T11:00:00.000Z"
}
```

**Errores**:

- `400`: Validación falla
- `403`: Usuario sin permisos
- `404`: Propietario no existe en asociación
- `409`: Número de unidad duplicado

---

### 7.2 Listar unidades de asociación

**Endpoint**: `GET /api/unidades/asociaciones/:id/unidades`

**Caso de uso**: Listar todas las unidades de la asociación.

**Permisos**: Miembro activo

**Query params**:

- `propietario_id` (opcional): Filtrar por propietario

**Response esperado** (200):

```json
[
  {
    "unidad_id": 10,
    "placa": "ABC-123",
    "numero_unidad": "U-042",
    "numero_puestos": 35,
    "propietario": {
      "id": 8,
      "nombre": "María González"
    },
    "modelo": "Mercedes-Benz 2018",
    "color": "Blanco"
  }
]
```

---

### 7.3 Actualizar unidad

**Endpoint**: `PUT /api/unidades/:id`

**Caso de uso**: Actualizar datos de una unidad.

**Permisos**: ADMIN o propietario de la unidad

**Request body**:

```json
{
  "placa": "ABC-123D",
  "numero_puestos": 40,
  "modelo": "Mercedes-Benz 2020",
  "color": "Azul"
}
```

**Reglas de negocio**:

1. Solo ADMIN o el propietario pueden actualizar
2. No se puede cambiar `propietario_id` (usar endpoint específico)
3. Todos los campos son opcionales

**Errores**:

- `403`: Usuario sin permisos
- `404`: Unidad no existe

---

## 8. Registros Fiscales

### 8.1 Crear registro fiscal

**Endpoint**: `POST /api/fiscal/registros`

**Caso de uso**: Fiscal registra fiscalización de una unidad.

**Permisos**: Usuario con rol FISCAL

**Request body**:

```json
{
  "unidad_id": 10,
  "asociacion_id": 1,
  "pasajeros": 28,
  "observaciones": "Viaje normal, sin incidencias"
}
```

**Validaciones**:

- `unidad_id`: int, requerido
- `asociacion_id`: int, requerido
- `pasajeros`: int, opcional
- `observaciones`: string, opcional

**Reglas de negocio**:

1. El usuario debe tener rol FISCAL en la asociación
2. La unidad debe pertenecer a la asociación
3. Se registra con timestamp automático
4. Se guarda el ID del fiscal que creó el registro

**Response esperado** (201):

```json
{
  "registro_id": 150,
  "unidad_id": 10,
  "fiscal_id": 15,
  "fecha_registro": "2026-07-30T12:30:00.000Z",
  "pasajeros": 28,
  "observaciones": "Viaje normal, sin incidencias"
}
```

**Errores**:

- `403`: Usuario no es FISCAL
- `404`: Unidad no existe en asociación

---

### 8.2 Listar registros fiscales

**Endpoint**: `GET /api/fiscal/registros/asociacion/:id`

**Caso de uso**: Listar todos los registros fiscales de una asociación.

**Permisos**: Miembro activo

**Query params**:

- `unidad_id` (opcional): Filtrar por unidad
- `fiscal_id` (opcional): Filtrar por fiscal
- `fecha_desde` (opcional): Fecha inicio
- `fecha_hasta` (opcional): Fecha fin

**Response esperado** (200):

```json
[
  {
    "registro_id": 150,
    "unidad": {
      "unidad_id": 10,
      "numero_unidad": "U-042",
      "placa": "ABC-123"
    },
    "fiscal": {
      "fiscal_id": 15,
      "nombre": "Pedro Martínez"
    },
    "fecha_registro": "2026-07-30T12:30:00.000Z",
    "pasajeros": 28,
    "observaciones": "Viaje normal, sin incidencias"
  }
]
```

---

## 9. Trazabilidad

### 9.1 Obtener trazabilidad de unidad

**Endpoint**: `GET /api/unidades/:id/traza`

**Caso de uso**: Ver historial completo de registros fiscales de una unidad.

**Permisos**: Miembro activo

**Response esperado** (200):

```json
{
  "unidad": {
    "unidad_id": 10,
    "numero_unidad": "U-042",
    "placa": "ABC-123"
  },
  "total_registros": 125,
  "primer_registro": "2026-01-15T08:00:00.000Z",
  "ultimo_registro": "2026-07-30T12:30:00.000Z",
  "registros": [
    {
      "registro_id": 150,
      "fecha_registro": "2026-07-30T12:30:00.000Z",
      "fiscal": "Pedro Martínez",
      "pasajeros": 28
    }
  ]
}
```

---

## 10. Exportación

### 10.1 Exportar datos a Excel

**Endpoint**: `GET /api/export/asociacion/:id`

**Caso de uso**: Exportar todos los datos de la asociación a Excel.

**Permisos**: Solo ADMIN

**Query params**:

- `incluir` (opcional): Secciones a incluir (ej: `miembros,unidades,registros`)

**Reglas de negocio**:

1. Genera archivo Excel en memoria
2. Incluye hojas separadas: Miembros, Unidades, Registros
3. Formato: `.xlsx`
4. Tamaño máximo: 50MB

**Response**: Archivo Excel descargable

**Headers de respuesta**:

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="asociacion-1-export.xlsx"
```

**Errores**:

- `403`: Usuario no es ADMIN
- `500`: Error generando Excel

---

## Reglas transversales

### Estados de membresía

| Estado     | Significado         | Puede acceder |
| ---------- | ------------------- | ------------- |
| ACTIVO     | Miembro activo      | ✓ Sí          |
| SUSPENDIDO | Suspensión temporal | ✗ No          |
| INACTIVO   | Baja definitiva     | ✗ No          |

### Roles y permisos

| Rol         | Crear asociación | Editar asociación | Invitar miembros | Crear unidades | Registrar fiscalizaciones |
| ----------- | ---------------- | ----------------- | ---------------- | -------------- | ------------------------- |
| ADMIN       | ✓                | ✓                 | ✓                | ✓              | ✗                         |
| PROPIETARIO | ✗                | ✗                 | ✗                | ✓ (propias)    | ✗                         |
| FISCAL      | ✗                | ✗                 | ✗                | ✗              | ✓                         |

### Validaciones de formato

- **Email**: Regex RFC 5322 básico
- **Password**: Min 8 caracteres, recomendado incluir mayúsculas, números y símbolos
- **RIF**: Formato venezolano (ej: J-12345678-9)
- **Placa**: Formato venezolano (ej: ABC-123)

### Límites

- **Logo**: Max 12MB base64
- **Nombre asociación**: Max 255 caracteres
- **Observaciones**: Max 1000 caracteres
- **Rate limit**: 100 requests por 15 minutos

---

## Cambios futuros planificados

- [ ] Implementar roles SUPERVISOR y AUDITOR
- [ ] Soporte para múltiples tipos de vehículos (bus, minibus, taxi)
- [ ] Geolocalización de registros fiscales
- [ ] Notificaciones push para invitaciones
- [ ] Dashboard con gráficos de trazabilidad
- [ ] API pública con OAuth2

---

## Referencias

- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura técnica
- [MATRIZ_APP_BACKEND.md](./MATRIZ_APP_BACKEND.md) - Contrato frontend/backend
- [docs/openapi.json](./docs/openapi.json) - Especificación OpenAPI completa

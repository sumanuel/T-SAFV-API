# 📚 Guía de Uso - Colección Postman T-SAFV API

## 🚀 Introducción

Esta colección contiene todos los endpoints disponibles de la API T-SAFV (Sistema de Traceabilidad, Administración, Fiscalización y Vehículos), organizados por módulos funcionales.

**Base URL**: `https://api-autoguardian.system-meek.com`

---

## 📥 Importar la Colección

### Opción 1: Importar archivo JSON

1. Abre **Postman**
2. Haz clic en **Import** (esquina superior izquierda)
3. Selecciona la pestaña **File**
4. Busca y selecciona: `T-SAFV-API-Collection.json`
5. Haz clic en **Import**

### Opción 2: Usar el link de Postman (si está disponible)

```
Próximamente se compartirá un link público de la colección
```

---

## 🔧 Configuración de Variables

La colección utiliza variables para facilitar las pruebas. Debes configurarlas:

### Variables Principales

| Variable        | Valor Inicial                      | Descripción                                      |
| --------------- | ---------------------------------- | ------------------------------------------------ |
| `base_url`      | `api-autoguardian.system-meek.com` | URL base de la API                               |
| `token`         | (vacío)                            | JWT token del usuario autenticado                |
| `asociacion_id` | `1`                                | ID de la asociación (reemplazar según necesidad) |
| `unidad_id`     | `1`                                | ID de la unidad/vehículo                         |
| `membresia_id`  | `1`                                | ID de la membresía                               |
| `invitacion_id` | `1`                                | ID de la invitación                              |

### Configurar Variables

#### Método 1: Desde el Workspace

1. Haz clic en el ícono de **Environment** (esquina superior derecha)
2. Selecciona o crea un nuevo environment
3. Configura las variables con tus valores
4. Haz clic en **Save**

#### Método 2: Desde la Colección

1. Haz clic en la colección **T-SAFV API**
2. Abre la pestaña **Variables**
3. Edita los valores iniciales
4. Guarda los cambios

---

## 🔐 Autenticación

### Paso 1: Registro (Primera vez)

**Endpoint**: `POST /api/auth/register`

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan.perez@example.com",
  "password": "SecurePass123",
  "telefono": "+58-412-1234567",
  "rif_cedula": "V-12345678",
  "direccion": "Calle Principal 123, Apartamento 4B"
}
```

### Paso 2: Iniciar Sesión

**Endpoint**: `POST /api/auth/login`

```json
{
  "email": "juan.perez@example.com",
  "password": "SecurePass123"
}
```

**Respuesta**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "email": "juan.perez@example.com",
    "nombre": "Juan"
  }
}
```

### Paso 3: Guardar el Token

1. Copia el `token` de la respuesta
2. Ve a las **Variables** de Postman
3. Pega el token en la variable `token`
4. Todos los endpoints autenticados lo usarán automáticamente

**O usa Postman Scripts** (automático):

```javascript
// En la pestaña "Tests" del endpoint /login
const response = pm.response.json();
pm.environment.set("token", response.token);
```

---

## 📋 Estructura de la Colección

```
T-SAFV API
├── 🔐 Autenticación
│   ├── Registro de Usuario
│   ├── Iniciar Sesión
│   ├── Solicitar Recuperación de Contraseña
│   ├── Verificar Código de Recuperación
│   ├── Resetear Contraseña
│   ├── Verificar Acceso a Crear Asociación
│   └── Actualizar Push Token
│
├── 🏢 Asociaciones
│   ├── Listar Mis Asociaciones
│   ├── Listar Todas Mis Asociaciones
│   ├── Crear Nueva Asociación
│   ├── Actualizar Asociación
│   ├── Listar Miembros
│   ├── Obtener Detalle de Miembro
│   ├── Crear Nuevo Miembro
│   └── Actualizar Miembro
│
├── 👥 Membresías
│   └── Cambiar Estado de Membresía
│
├── 📧 Invitaciones
│   ├── Crear Invitación
│   ├── Listar Mis Invitaciones
│   ├── Listar Invitaciones de Asociación
│   ├── Cancelar Invitación
│   └── Responder (Aceptar) Invitación
│
├── 🚐 Unidades (Vehículos)
│   ├── Crear Unidad
│   └── Actualizar Unidad
│
├── 👨‍🌾 Propietario
│   ├── Obtener Mis Unidades de Asociación
│   ├── Obtener Trazabilidad de Unidad
│   ├── Obtener Todas Mis Unidades
│   └── Obtener Toda Mi Trazabilidad
│
├── 🚔 Fiscal
│   ├── Obtener Unidades Activas
│   └── Crear Registro de Fiscalización
│
└── 📊 Exportación
    ├── Exportar Miembros (CSV/Excel)
    ├── Exportar Unidades (CSV/Excel)
    └── Exportar Trazabilidad (CSV/Excel)
```

---

## 🎯 Flujo de Trabajo Típico

### 1. Crear Nueva Asociación

```
1. POST /api/auth/login
   → Guardar token

2. POST /api/asociaciones (Crear Nueva Asociación)
   → Guardar asociacion_id

3. POST /api/asociaciones/{id}/miembros (Agregar Miembros)
   → Crear PROPIETARIOS y FISCALES
```

### 2. Agregar Unidades (Vehículos)

```
1. POST /api/asociaciones/{id}/unidades (Crear Unidad)
   → Guardar unidad_id

2. GET /api/propietario/mis-unidades
   → Ver todas mis unidades

3. GET /api/propietario/mi-trazabilidad
   → Ver historial completo
```

### 3. Crear Registros de Fiscalización

```
1. GET /api/fiscal/asociaciones/{id}/unidades
   → Obtener unidades disponibles

2. POST /api/fiscal/registros (Crear Registro)
   → Registrar fiscalización

3. GET /api/propietario/mi-trazabilidad
   → Ver registro en historial
```

### 4. Gestionar Invitaciones

```
1. POST /api/invitaciones (Crear Invitación)
   → Invitar nuevo miembro

2. GET /api/invitaciones/mine
   → Ver invitaciones recibidas (como invitado)

3. POST /api/invitaciones/respond (Aceptar)
   → Aceptar invitación
```

---

## 🔄 Scripts de Postman Útiles

### Script para Guardar Token Automáticamente

Agrega esto en la pestaña **Tests** del endpoint `/api/auth/login`:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("token", response.token);
  console.log("✅ Token guardado: " + response.token.substring(0, 20) + "...");
} else {
  console.log("❌ Error en login: " + pm.response.code);
}
```

### Script para Extraer IDs

Agrega esto en la pestaña **Tests** de endpoints que crean recursos:

```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
  const response = pm.response.json();

  if (response.asociacion && response.asociacion.id) {
    pm.environment.set("asociacion_id", response.asociacion.id);
    console.log("📌 asociacion_id actualizado: " + response.asociacion.id);
  }

  if (response.unidad && response.unidad.id) {
    pm.environment.set("unidad_id", response.unidad.id);
    console.log("📌 unidad_id actualizado: " + response.unidad.id);
  }
}
```

---

## ⚠️ Códigos de Respuesta Comunes

| Código  | Significado  | Acción                      |
| ------- | ------------ | --------------------------- |
| **200** | OK           | Éxito                       |
| **201** | Created      | Recurso creado exitosamente |
| **400** | Bad Request  | Revisa los datos enviados   |
| **401** | Unauthorized | Token no válido o expirado  |
| **403** | Forbidden    | No tienes permisos          |
| **404** | Not Found    | Recurso no existe           |
| **500** | Server Error | Contacta al administrador   |

---

## 🆘 Solución de Problemas

### Error: "401 Unauthorized"

- **Causa**: Token inválido, expirado o vacío
- **Solución**:
  1. Verifica que has hecho login
  2. Copia el token correcto
  3. Verifica que la variable `token` está configurada
  4. Haz login nuevamente para obtener un token fresco

### Error: "403 Forbidden"

- **Causa**: No tienes permisos para esta acción
- **Solución**:
  1. Verifica tu rol en la asociación (ADMIN, FISCAL, PROPIETARIO)
  2. Algunos endpoints requieren permisos específicos
  3. Contacta al administrador de la asociación

### Error: "404 Not Found"

- **Causa**: El recurso no existe
- **Solución**:
  1. Verifica que el ID es correcto
  2. Asegúrate de que el recurso pertenece a la asociación actual
  3. Comprueba que no ha sido eliminado

### Error: "429 Too Many Requests"

- **Causa**: Has superado el límite de solicitudes
- **Solución**: Espera unos minutos antes de reintentar

---

## 📞 Contacto y Soporte

- **URL API**: https://api-autoguardian.system-meek.com
- **Email Soporte**: soporte@autoguardian.com
- **Documentación**: [Leer docs](#)

---

## 📝 Notas

- Los tokens JWT expiran después de un tiempo específico
- Siempre usa HTTPS en producción
- Nunca compartas tu token
- Para desarrollo, puede usar postman con variables de environment

**Última actualización**: 7 de septiembre de 2026

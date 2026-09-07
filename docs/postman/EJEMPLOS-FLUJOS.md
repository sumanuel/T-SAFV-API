# 🎬 Ejemplos de Flujos Completos - T-SAFV API

Este documento contiene ejemplos prácticos de flujos de trabajo completos que puedes probar en Postman.

---

## 📌 Flujo 1: Crear una Asociación Completa

Este flujo muestra cómo crear una asociación desde cero y agregar miembros.

### Paso 1: Registrarse

**Método**: `POST`  
**Endpoint**: `/api/auth/register`

**Body**:

```json
{
  "nombre": "Carlos",
  "apellido": "Meneses",
  "email": "carlos.meneses@transportistas.com",
  "password": "TransportPass2024!",
  "telefono": "+58-412-9876543",
  "rif_cedula": "V-25987654",
  "direccion": "Avenida Libertador, Edificio Transporte, Piso 5"
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "usuario": {
    "id": 10,
    "email": "carlos.meneses@transportistas.com",
    "nombre": "Carlos"
  }
}
```

### Paso 2: Iniciar Sesión

**Método**: `POST`  
**Endpoint**: `/api/auth/login`

**Body**:

```json
{
  "email": "carlos.meneses@transportistas.com",
  "password": "TransportPass2024!"
}
```

**Respuesta esperada** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwiZW1haWwiOiJjYXJsb3MubWVuZXNlc0B0cmFuc3BvcnRpc3Rhcy5jb20iLCJpYXQiOjE2OTM1NDMyMDB9.abc123def456...",
  "usuario": {
    "id": 10,
    "email": "carlos.meneses@transportistas.com",
    "nombre": "Carlos"
  }
}
```

**Acción**: Copia el token y pégalo en la variable `token` de Postman

### Paso 3: Crear Asociación

**Método**: `POST`  
**Endpoint**: `/api/asociaciones`

**Headers**:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**:

```json
{
  "nombre": "Asociación de Transportistas Metropolitanos",
  "rif": "J-50123456-7",
  "direccion_fiscal": "Avenida Libertador 1234, Edificio Transporte, Piso 5, Caracas",
  "email": "contacto@transportistas-metro.com",
  "telefonos": "+58-212-1234567, +58-412-7654321",
  "logo_url": "https://example.com/logo-metro.png",
  "redes_sociales": {
    "facebook": "https://facebook.com/transportistas-metro",
    "instagram": "https://instagram.com/transportistas_metro",
    "whatsapp": "+58-412-1111111"
  }
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Asociación creada exitosamente",
  "asociacion": {
    "id": 15,
    "nombre": "Asociación de Transportistas Metropolitanos",
    "rif": "J-50123456-7",
    "propietario_id": 10,
    "estado": "ACTIVA",
    "fecha_creacion": "2026-09-07T14:30:00Z"
  }
}
```

**Acción**: Copia el `asociacion.id` (15) y pégalo en la variable `asociacion_id`

### Paso 4: Agregar Miembros (Propietarios y Fiscales)

**Método**: `POST`  
**Endpoint**: `/api/asociaciones/{{asociacion_id}}/miembros`

**Headers**:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body - Agregar Propietario**:

```json
{
  "nombre": "Miguel",
  "email": "miguel.rodriguez@example.com",
  "rol": "PROPIETARIO",
  "estado_invitacion": "PENDIENTE_INVITACION"
}
```

**Body - Agregar Fiscal**:

```json
{
  "nombre": "Ana",
  "email": "ana.garcia@example.com",
  "rol": "FISCAL",
  "punto_control": "Terminal Central Caracas",
  "estado_invitacion": "PENDIENTE_INVITACION"
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Miembro agregado exitosamente",
  "membresia": {
    "id": 45,
    "usuario_id": 11,
    "asociacion_id": 15,
    "rol": "PROPIETARIO"
  }
}
```

---

## 📌 Flujo 2: Crear Unidades (Vehículos)

Este flujo muestra cómo agregar vehículos a la asociación.

### Paso 1: Crear Primera Unidad

**Método**: `POST`  
**Endpoint**: `/api/asociaciones/{{asociacion_id}}/unidades`

**Headers**:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**:

```json
{
  "propietario_id": 11,
  "placa": "ABD-2024",
  "numero_unidad": "TRANS-001",
  "numero_puestos": 50,
  "marca": "Mercedes-Benz",
  "modelo": "O400RS",
  "ano": 2023,
  "color": "Blanco con líneas roja",
  "uso": "Transporte de pasajeros",
  "capacidad": "50 pasajeros",
  "serial_carroceria": "SER123456789ABC",
  "serial_motor": "MOT987654321XYZ",
  "numero_cilindros": 6,
  "peso": "15000 kg",
  "numero_poliza_rcv": "RCV-2024-123456",
  "numero_placa_asignada": "TR-2024-50",
  "fecha_emision": "2023-05-15",
  "chofer": "Pedro González López"
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Unidad creada exitosamente",
  "unidad": {
    "id": 78,
    "placa": "ABD-2024",
    "numero_unidad": "TRANS-001",
    "numero_puestos": 50,
    "estado": "ACTIVA",
    "propietario_id": 11,
    "asociacion_id": 15
  }
}
```

**Acción**: Copia el `unidad.id` (78) y pégalo en la variable `unidad_id`

### Paso 2: Crear Segunda Unidad

Repite el Paso 1 con datos diferentes:

```json
{
  "propietario_id": 11,
  "placa": "ABD-2025",
  "numero_unidad": "TRANS-002",
  "numero_puestos": 45,
  "marca": "Volvo",
  "modelo": "B460",
  "ano": 2022,
  "color": "Azul",
  "chofer": "Juan Carlos Rodríguez"
}
```

---

## 📌 Flujo 3: Registrar Fiscalización

Este flujo muestra cómo crear registros de fiscalización/trazabilidad.

### Paso 1: Ver Unidades Disponibles (como Fiscal)

**Nota**: Necesitas estar logeado como usuario con rol FISCAL

**Método**: `GET`  
**Endpoint**: `/api/fiscal/asociaciones/{{asociacion_id}}/unidades`

**Headers**:

```
Authorization: Bearer {{token}}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "unidades": [
    {
      "id": 78,
      "placa": "ABD-2024",
      "numero_unidad": "TRANS-001",
      "numero_puestos": 50,
      "chofer": "Pedro González López"
    },
    {
      "id": 79,
      "placa": "ABD-2025",
      "numero_unidad": "TRANS-002",
      "numero_puestos": 45,
      "chofer": "Juan Carlos Rodríguez"
    }
  ]
}
```

### Paso 2: Crear Registro de Fiscalización

**Método**: `POST`  
**Endpoint**: `/api/fiscal/registros`

**Headers**:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**:

```json
{
  "unidad_id": 78,
  "asociacion_id": 15,
  "chofer": "Pedro González López",
  "origen": "Terminal Central Caracas",
  "destino": "Ciudad de Oro",
  "pasajeros": 48
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Registro de fiscalización creado exitosamente",
  "registro": {
    "id": 456,
    "unidad_id": 78,
    "fiscal_id": 12,
    "hora_inicio": "2026-09-07T08:30:00Z",
    "origen": "Terminal Central Caracas",
    "destino": "Ciudad de Oro",
    "pasajeros": 48
  }
}
```

### Paso 3: Verificar Trazabilidad (como Propietario)

**Método**: `GET`  
**Endpoint**: `/api/propietario/unidades/{{unidad_id}}/trazabilidad`

**Headers**:

```
Authorization: Bearer {{token}}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "unidad": {
    "id": 78,
    "placa": "ABD-2024",
    "numero_unidad": "TRANS-001"
  },
  "registros": [
    {
      "id": 456,
      "fecha": "2026-09-07T08:30:00Z",
      "fiscal": "Ana García",
      "origen": "Terminal Central Caracas",
      "destino": "Ciudad de Oro",
      "pasajeros": 48,
      "duracion": "3h 45m"
    }
  ]
}
```

---

## 📌 Flujo 4: Invitaciones (Agregar Nuevos Usuarios)

Este flujo muestra cómo invitar nuevos usuarios a una asociación.

### Paso 1: Crear Invitación

**Método**: `POST`  
**Endpoint**: `/api/invitaciones`

**Headers**:

```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**:

```json
{
  "asociacion_id": 15,
  "email_invitado": "nuevo.fiscal@example.com",
  "rol_invitado": "FISCAL"
}
```

**Respuesta esperada** (201):

```json
{
  "success": true,
  "message": "Invitación enviada a nuevo.fiscal@example.com",
  "invitacion": {
    "id": 89,
    "email": "nuevo.fiscal@example.com",
    "rol": "FISCAL",
    "estado": "ENVIADA",
    "fecha_invitacion": "2026-09-07T14:45:00Z"
  }
}
```

### Paso 2: Verificar Invitaciones (como Usuario Invitado)

**Nota**: Logearse con la cuenta `nuevo.fiscal@example.com`

**Método**: `GET`  
**Endpoint**: `/api/invitaciones/mine`

**Headers**:

```
Authorization: Bearer {{token_nuevo_usuario}}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "invitaciones": [
    {
      "id": 89,
      "asociacion": "Asociación de Transportistas Metropolitanos",
      "rol": "FISCAL",
      "invitado_por": "Carlos Meneses",
      "fecha_invitacion": "2026-09-07T14:45:00Z"
    }
  ]
}
```

### Paso 3: Aceptar Invitación

**Método**: `POST`  
**Endpoint**: `/api/invitaciones/respond`

**Headers**:

```
Authorization: Bearer {{token_nuevo_usuario}}
Content-Type: application/json
```

**Body**:

```json
{
  "invitacion_id": 89,
  "aceptar": true
}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "message": "Invitación aceptada exitosamente",
  "membresia": {
    "id": 50,
    "usuario_id": 15,
    "asociacion_id": 15,
    "rol": "FISCAL"
  }
}
```

---

## 📌 Flujo 5: Recuperación de Contraseña

Este flujo muestra el proceso completo de recuperación de contraseña.

### Paso 1: Solicitar Recuperación

**Método**: `POST`  
**Endpoint**: `/api/auth/forgot-password`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "email": "carlos.meneses@transportistas.com"
}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "message": "Código enviado a tu email"
}
```

**Acción**: Revisar el email y obtener el código de 6 dígitos (ej: `123456`)

### Paso 2: Verificar Código

**Método**: `POST`  
**Endpoint**: `/api/auth/verify-reset-code`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "email": "carlos.meneses@transportistas.com",
  "code": "123456"
}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwiY29kZV9pZCI6MjMsImlhdCI6MTY5MzU0MzIwMH0.xyz789...",
  "message": "Código verificado"
}
```

**Acción**: Copia el `resetToken`

### Paso 3: Resetear Contraseña

**Método**: `POST`  
**Endpoint**: `/api/auth/reset-password`

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NuevaPassword2024!"
}
```

**Respuesta esperada** (200):

```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### Paso 4: Iniciar Sesión con Nueva Contraseña

**Método**: `POST`  
**Endpoint**: `/api/auth/login`

**Body**:

```json
{
  "email": "carlos.meneses@transportistas.com",
  "password": "NuevaPassword2024!"
}
```

**Respuesta esperada** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 10,
    "email": "carlos.meneses@transportistas.com"
  }
}
```

---

## 📌 Flujo 6: Exportar Datos

Este flujo muestra cómo exportar datos en CSV o Excel.

### Exportar Miembros

**Método**: `GET`  
**Endpoint**: `/api/export/asociaciones/{{asociacion_id}}/miembros`

**Headers**:

```
Authorization: Bearer {{token}}
```

**Parámetros de query** (opcionales):

```
?format=csv  # o xlsx
```

**Respuesta esperada**: Archivo CSV/Excel descargado

### Exportar Unidades

**Método**: `GET`  
**Endpoint**: `/api/export/asociaciones/{{asociacion_id}}/unidades`

**Headers**:

```
Authorization: Bearer {{token}}
```

### Exportar Trazabilidad

**Método**: `GET`  
**Endpoint**: `/api/export/asociaciones/{{asociacion_id}}/trazabilidad`

**Headers**:

```
Authorization: Bearer {{token}}
```

---

## 🧪 Pruebas Rápidas

### Test 1: Verificar Conexión

```
GET https://api-autoguardian.system-meek.com/
```

Debería retornar `200 OK` con mensaje: "T-SAFV API is running!"

### Test 2: Intentar Acceso sin Token

```
GET https://api-autoguardian.system-meek.com/api/asociaciones/mine
```

Debería retornar `401 Unauthorized` (sin token)

### Test 3: Validación de Email

```
POST https://api-autoguardian.system-meek.com/api/auth/login
Body: {
  "email": "invalid-email",
  "password": "pass123"
}
```

Debería retornar `400 Bad Request` (email inválido)

---

## 📞 Contacto

Para reportar problemas o sugerencias sobre los endpoints:

- Email: soporte@autoguardian.com
- Documentación: https://docs.autoguardian.com

**Última actualización**: 7 de septiembre de 2026

# ⚡ Quick Start - T-SAFV API en Postman

## 🎯 5 Minutos para Empezar

### 1️⃣ Importar Colección (1 min)

1. Abre Postman
2. Haz clic en **Import**
3. Busca y selecciona: `T-SAFV-API-Collection.json`
4. Haz clic en **Import**

### 2️⃣ Importar Environment (30 seg)

1. Haz clic en el ícono de **Environments** (esquina superior derecha)
2. Haz clic en **Import**
3. Selecciona: `T-SAFV-API-Environment.json`
4. Selecciona el environment: **T-SAFV API - Production**

### 3️⃣ Configurar URL Base (30 seg)

1. En el environment abierto, edita:
   - `base_url`: `api-autoguardian.system-meek.com`
2. Haz clic en **Save**

### 4️⃣ Registrarse (1 min)

1. Abre la colección → **🔐 Autenticación** → **Registro de Usuario**
2. Edita el body con tus datos:
   ```json
   {
     "nombre": "Tu Nombre",
     "email": "tu@email.com",
     "password": "TuPassword123"
   }
   ```
3. Haz clic en **Send**

### 5️⃣ Iniciar Sesión (1 min)

1. Abre **🔐 Autenticación** → **Iniciar Sesión**
2. Edita el body:
   ```json
   {
     "email": "tu@email.com",
     "password": "TuPassword123"
   }
   ```
3. Haz clic en **Send**
4. Copia el `token` de la respuesta
5. En el environment, pega en la variable `token`
6. Haz clic en **Save**

### ✅ ¡Listo! Ya puedes usar cualquier endpoint

---

## 🚀 Primeros Pasos

### Crear una Asociación

1. Ve a **🏢 Asociaciones** → **Crear Nueva Asociación**
2. Edita el body con tus datos
3. Haz clic en **Send**
4. Copia el `id` y pégalo en la variable `asociacion_id`

### Agregar Unidades

1. Ve a **🚐 Unidades** → **Crear Unidad**
2. Asegúrate de tener `asociacion_id` configurado
3. Edita el body con datos del vehículo
4. Haz clic en **Send**

### Ver Trazabilidad

1. Ve a **👨‍🌾 Propietario** → **Obtener Mi Trazabilidad**
2. Haz clic en **Send**
3. ¡Listo! Verás todo el historial

---

## 📋 Comandos Útiles

### Ver todas las variables configuradas

```
En la esquina superior derecha → Environment → Ver actual
```

### Actualizar una variable

```
Haz clic en el ícono de ojos → Edita → Save
```

### Crear una carpeta de pruebas personales

```
Haz clic derecho en la colección → Add folder
Nombre: "Mis Pruebas"
```

### Generar código (cURL, Python, Node.js)

```
1. Haz clic en un request
2. Haz clic en el botón </> (código)
3. Selecciona tu lenguaje
4. Copia el código
```

---

## 🔍 Endpoints Más Usados

| Acción               | Ruta                               | Método |
| -------------------- | ---------------------------------- | ------ |
| Registrarse          | `/api/auth/register`               | POST   |
| Login                | `/api/auth/login`                  | POST   |
| Crear Asociación     | `/api/asociaciones`                | POST   |
| Ver Mis Asociaciones | `/api/asociaciones/mine`           | GET    |
| Crear Unidad         | `/api/asociaciones/{id}/unidades`  | POST   |
| Ver Mi Trazabilidad  | `/api/propietario/mi-trazabilidad` | GET    |
| Agregar Fiscal       | `/api/asociaciones/{id}/miembros`  | POST   |

---

## ⚠️ Errores Comunes

| Error            | Causa             | Solución             |
| ---------------- | ----------------- | -------------------- |
| 401 Unauthorized | Token no válido   | Haz login nuevamente |
| 403 Forbidden    | Sin permisos      | Verifica tu rol      |
| 404 Not Found    | Recurso no existe | Verifica el ID       |
| 400 Bad Request  | Datos incorrectos | Revisa el JSON       |

---

## 🆘 Ayuda Rápida

**¿Olvidé configurar el token?**

- Ve a un endpoint de autenticación (login)
- Haz click en **Send**
- Copia el token de la respuesta
- En el environment, actualiza la variable `token`

**¿Necesito cambiar de asociación?**

- En el environment, edita `asociacion_id`
- Todos los requests usarán la nueva asociación

**¿Cómo sé si un endpoint requiere autenticación?**

- Revisa si tiene `Authorization: Bearer {{token}}` en los headers
- Si lo tiene, necesitas un token válido

---

## 📞 Más Información

- **Documentación Completa**: [README.md](./README.md)
- **Ejemplos de Flujos**: [EJEMPLOS-FLUJOS.md](./EJEMPLOS-FLUJOS.md)
- **URL API**: https://api-autoguardian.system-meek.com

---

**¡Disfruta usando T-SAFV API! 🚀**

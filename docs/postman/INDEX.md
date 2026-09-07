# 📮 T-SAFV API - Colección Postman

Esta carpeta contiene todos los archivos necesarios para probar la API T-SAFV en Postman.

## 📦 Archivos Incluidos

### 1. **T-SAFV-API-Collection.json**

Colección completa con todos los endpoints disponibles:

- ✅ 35+ endpoints
- ✅ Todos los módulos del sistema
- ✅ Ejemplos de request/response
- ✅ Variables automáticas

**Uso**: Importa este archivo en Postman

### 2. **T-SAFV-API-Environment.json**

Environment pre-configurado con variables:

- `base_url`: URL de la API
- `token`: JWT autenticación
- `asociacion_id`, `unidad_id`, etc.

**Uso**: Importa este archivo y selecciónalo en Postman

### 3. **QUICK-START.md** ⭐ (Comienza aquí)

Guía rápida de 5 minutos para empezar:

- Pasos simples
- Primeros endpoints
- Solución de problemas comunes

**Recomendación**: Lee esto primero si es tu primera vez

### 4. **README.md** (Referencia Completa)

Documentación exhaustiva:

- Configuración detallada
- Todos los endpoints explicados
- Scripts de Postman
- Códigos de respuesta
- Troubleshooting avanzado

**Uso**: Referencia cuando necesites más detalles

### 5. **EJEMPLOS-FLUJOS.md** (Tutoriales)

6 flujos de trabajo completos con ejemplos:

1. Crear Asociación Completa
2. Crear Unidades
3. Registrar Fiscalización
4. Invitaciones
5. Recuperación de Contraseña
6. Exportar Datos

**Uso**: Aprende siguiendo ejemplos reales

---

## 🚀 Guía de Inicio Rápido

### Paso 1: Descargar Archivos

```
Descarga estos 4 archivos en una carpeta:
- T-SAFV-API-Collection.json
- T-SAFV-API-Environment.json
- (Los .md son solo para referencia)
```

### Paso 2: Importar en Postman

```
1. Abre Postman
2. Haz clic en "Import"
3. Selecciona: T-SAFV-API-Collection.json
4. Repite con: T-SAFV-API-Environment.json
```

### Paso 3: Configurar Environment

```
1. Selecciona el environment "T-SAFV API - Production"
2. Edita base_url si es necesario
3. Guarda
```

### Paso 4: Autenticarse

```
1. POST /api/auth/register (crear cuenta)
2. POST /api/auth/login (obtener token)
3. Copiar token en la variable "token"
```

### Paso 5: ¡Comienza a probar!

```
Todos los endpoints están listos para usar
```

---

## 📖 Documentación por Tema

### Para Nuevos Usuarios

1. Comienza con: **QUICK-START.md**
2. Luego lee: **README.md**
3. Practica con: **EJEMPLOS-FLUJOS.md**

### Para Desarrollo

- Referencia de endpoints: **README.md** (Sección: Estructura de la Colección)
- Códigos de respuesta: **README.md** (Sección: Códigos de Respuesta Comunes)
- Scripts de automatización: **README.md** (Sección: Scripts de Postman Útiles)

### Para Testing

- Flujos completos: **EJEMPLOS-FLUJOS.md**
- Casos de uso: **EJEMPLOS-FLUJOS.md**
- Troubleshooting: **README.md** (Sección: Solución de Problemas)

---

## 🌐 URLs Importantes

- **API Base URL**: `https://api-autoguardian.system-meek.com`
- **Documentación**: (próximamente)
- **Soporte**: soporte@autoguardian.com

---

## ✨ Características Principales

✅ **35+ Endpoints** - Todos los módulos del sistema  
✅ **Autenticación JWT** - Seguridad integrada  
✅ **Ejemplos Reales** - Datos de ejemplo en cada request  
✅ **Variables Automáticas** - Simplifica la configuración  
✅ **Documentación Completa** - Guías paso a paso  
✅ **Flujos de Trabajo** - Casos de uso reales

---

## 📋 Estructura de Endpoints

```
Autenticación (7 endpoints)
├── Registro
├── Login
├── Recuperación de Contraseña
└── Push Notifications

Asociaciones (8 endpoints)
├── Listar/Crear Asociaciones
├── Gestionar Miembros
└── Actualizar Información

Membresías (1 endpoint)
└── Cambiar Estado

Invitaciones (5 endpoints)
├── Crear/Listar Invitaciones
├── Aceptar/Rechazar
└── Cancelar

Unidades (2 endpoints)
├── Crear Unidades
└── Actualizar Información

Propietario (4 endpoints)
├── Ver Mis Unidades
└── Historial de Trazabilidad

Fiscal (2 endpoints)
├── Unidades Activas
└── Crear Registros

Exportación (3 endpoints)
├── Exportar Miembros
├── Exportar Unidades
└── Exportar Trazabilidad
```

---

## 🔐 Seguridad

- 🔒 Todos los endpoints sensibles requieren autenticación JWT
- 🛡️ Rate limiting activado (100 requests/15 min)
- 🚫 Validación de permisos en cada request
- 📋 Roles basados en acceso (ADMIN, FISCAL, PROPIETARIO)

---

## 🐛 Reportar Problemas

Si encuentras errores o tienes sugerencias:

1. Verifica la documentación (README.md)
2. Revisa los ejemplos (EJEMPLOS-FLUJOS.md)
3. Comprueba tu configuración (variables de environment)
4. Contacta a soporte: soporte@autoguardian.com

---

## 📅 Versión y Fecha

- **Versión**: 1.0.0
- **Fecha**: 7 de septiembre de 2026
- **Última actualización**: 7 de septiembre de 2026

---

## 📝 Notas

- Los tokens JWT expiran después de un tiempo. Si obtienes "401 Unauthorized", haz login nuevamente.
- Siempre usa HTTPS en producción.
- Nunca compartas tu token en repositorios públicos.
- Las variables de environment son locales a tu Postman.

---

## 🎯 Próximos Pasos

1. ✅ Leer **QUICK-START.md** (5 minutos)
2. ✅ Importar colección en Postman
3. ✅ Configurar environment
4. ✅ Crear una cuenta
5. ✅ Probar un endpoint
6. ✅ Leer **README.md** para más detalles
7. ✅ Seguir un flujo en **EJEMPLOS-FLUJOS.md**

---

**¡Bienvenido a T-SAFV API! 🚀**

Para más información, consulta los archivos de documentación incluidos.

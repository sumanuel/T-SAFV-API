# Contexto del proyecto: T-SAFV-API

Ultima actualizacion: 2026-06-29

## Resumen rapido

T-SAFV-API es el backend Express del ecosistema T-SAFV. Expone autenticacion, asociaciones, miembros, invitaciones, propietarios, fiscales, unidades, trazabilidad y exportacion. Usa PostgreSQL y middleware de roles para proteger operaciones por tipo de usuario y pertenencia a una asociacion.

## Stack y arquitectura

- Runtime: Node.js.
- Framework: Express.
- Base de datos: PostgreSQL.
- Auth: JWT.
- Seguridad: helmet, express-rate-limit, sanitizacion, validacion de inputs.
- Testing: Jest + Supertest.

## Punto de entrada y flujo base

- Entrada principal: index.js
- Rutas: src/routes
- Controladores: src/controllers
- Modelos y acceso a datos: src/models
- Middlewares: src/middlewares

El servidor hace estas tareas base:

1. carga variables de entorno
2. monta seguridad HTTP y rate limiting
3. habilita JSON con limite ampliado para logos en base64
4. registra rutas por modulo
5. cierra con errorHandler central

## Modulos funcionales principales

- auth
- asociaciones
- membresias
- invitaciones
- unidades
- propietario
- fiscal
- export

## Rutas clave

- /api/auth
- /api/unidades
- /api/asociaciones
- /api/invitaciones
- /api/propietario
- /api/fiscal
- /api/export
- /api con membresiaRoutes

## Casos de negocio relevantes ya implementados

- una asociacion puede crearse con membresia automatica ADMIN para el creador
- las asociaciones ya listan miembros, unidades, trazabilidad y pagos
- se pueden crear miembros directos por asociacion con rol PROPIETARIO o FISCAL
- existe exportacion Excel en memoria
- el resumen de asociaciones ya devuelve conteos operativos y estado de licencia

## Carpetas que conviene leer primero

- src/routes
- src/controllers
- src/models
- src/middlewares
- CHANGELOG.md

## Comandos utiles

```bash
npm install
npm run dev
npm run test
npm run migrate
```

## Estado actual y notas operativas

- El changelog esta bastante mejor mantenido que en otros repos y sirve como fuente real de evolucion reciente.
- express.json usa limite de 12mb por soporte de logos persistidos en base64.
- authMiddleware ya incluye verificadores por asociacion, no solo auth global.

## Riesgos o deuda visible

- Al cambiar payloads de asociaciones o unidades hay que revisar a la vez T-SAFV-App.
- La logica de permisos esta distribuida entre middleware y controladores; conviene no duplicarla sin motivo.
- Si crece el sistema de exportacion o trazabilidad, habra que vigilar rendimiento e indices en PostgreSQL.

## Recomendacion para futuras sesiones

Antes de tocar un endpoint:

1. leer la ruta en src/routes
2. leer el controlador asociado
3. revisar el modelo subyacente
4. confirmar impacto en T-SAFV-App si el contrato cambia

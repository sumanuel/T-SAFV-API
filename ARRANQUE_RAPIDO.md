# Arranque rapido: T-SAFV-API

Ultima actualizacion: 2026-06-29

## Requisitos

- Node.js.
- npm.
- PostgreSQL accesible.

## Variables de entorno detectadas

- PORT
- JWT_SECRET
- DATABASE_URL
- PGSSL
- PG_SSL_ROOT_CERT
- PG_CONNECTION_OPTIONS
- EMAIL_USER
- EMAIL_PASS
- APP_URL

Notas:

- La conexion principal se resuelve via DATABASE_URL.
- PGSSL es true por defecto salvo valores false-like.
- APP_URL se usa en invitaciones para construir enlaces o referencias.

## Instalacion

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

## Migraciones

```bash
npm run migrate
```

## Smoke test recomendado

```bash
npm run test
```

Chequeo manual minimo:

1. GET /
2. probar register y login
3. probar /api/asociaciones/mine con token valido
4. si cambiaste unidades o invitaciones, validar esos endpoints con payload real

## Despliegue

Pasos sugeridos:

1. configurar variables de entorno del servidor
2. correr migraciones
3. ejecutar npm run test
4. iniciar con npm run start en el entorno objetivo

## Archivos que conviene leer primero

- CONTEXTO_PROYECTO.md
- MATRIZ_APP_BACKEND.md
- src/config/database.js
- CHANGELOG.md

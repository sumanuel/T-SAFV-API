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
- ACCESS_TOKEN_TTL (opcional, 24h por defecto)
- REFRESH_TOKEN_TTL_DAYS (opcional, 30 por defecto)
- ADJUNTO_MAX_BYTES (opcional, 3 MB por defecto: tamano maximo de una foto)
- RETENCION_DIAS_FOTO_REGISTRO (opcional, 90 por defecto; 0 = no purgar las fotos de fiscalizaciones)
- RETENCION_MESES_FOTO_INCIDENCIA (opcional, 12 por defecto; meses tras el cierre; 0 = no purgar las de incidencias)

Notas:

- Tests: `npm test` corre solo los unitarios (BD simulada). `npm run test:integration` escribe en la BD real del .env.
- Fotos: `node scripts/purgar_adjuntos.js` informa que se borraria segun la retencion (valores provisionales del PLAN-002 §6); `--aplicar` borra. No hay ninguna purga automatica: solo ocurre si el cron del hosting ejecuta el script con `--aplicar`.

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

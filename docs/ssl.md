Habilitar SSL/TLS para PostgreSQL

Resumen

Esta guía explica dónde y cómo habilitar TLS en el servidor PostgreSQL y cómo configurar la aplicación Node.js para verificar certificados con `PG_SSL_ROOT_CERT`.

1. En el servidor de base de datos (Administrador/Ops)

- Generar o adquirir certificados:
  - Archivo de certificado de servidor (`server.crt`) y clave privada (`server.key`).
  - (Opcional) Archivo CA (`ca.pem`) si se firmaron certificados con una CA interna.
- En `postgresql.conf` habilitar TLS:
  - `ssl = on`
  - `ssl_cert_file = '/ruta/server.crt'`
  - `ssl_key_file = '/ruta/server.key'`
  - `ssl_ca_file = '/ruta/ca.pem'` (opcional)
- Reiniciar PostgreSQL y verificar que acepta conexiones TLS.
- Si usas un proveedor gestionado (RDS, Cloud SQL, Azure DB), sigue su guía para habilitar TLS y descarga el certificado CA que proporcionan.

2. En la aplicación Node.js (T-SAFV-API)

- Coloca el archivo `ca.pem` en una ruta segura del servidor de la app (no en el repositorio).
- Configura variables de entorno en producción:
  - `PGSSL=true` (opcional, es el valor por defecto ahora)
  - `PG_SSL_ROOT_CERT=/ruta/ca.pem`
- `src/config/database.js` leerá `PG_SSL_ROOT_CERT` y usará `ssl.ca` y `rejectUnauthorized:true` cuando el archivo exista.

Notas de seguridad

- No uses `rejectUnauthorized:false` en producción.
- Protege el archivo `ca.pem` con permisos restringidos.
- Considera el uso de `sslmode=verify-full` en la cadena de conexión si tu entorno lo soporta.

Verificación

- Desde el host de la app, prueba la conexión con `psql` usando TLS:

```powershell
psql "postgresql://user@host:5432/dbname?sslmode=verify-full&sslrootcert=/ruta/ca.pem"
```

- Reinicia la app y comprueba los logs de conexión; `src/config/database.js` ahora mostrará errores si falla la lectura del certificado.

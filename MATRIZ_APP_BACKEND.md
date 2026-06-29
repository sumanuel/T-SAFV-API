# Matriz app/backend: T-SAFV

Ultima actualizacion: 2026-06-29

Esta matriz replica el contrato critico desde la perspectiva del backend. Debe mantenerse sincronizada con T-SAFV-App/MATRIZ_APP_BACKEND.md.

## Validaciones y campos fragiles

| Ruta                                                      | Validaciones backend                                                      | Campos fragiles                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| POST /api/auth/register                                   | nombre min 2, email valido, password min 8                                | nombre, email, password                              |
| POST /api/invitaciones                                    | asociacion_id int, email_invitado email, rol_invitado enum                | email_invitado, rol_invitado                         |
| POST /api/asociaciones                                    | nombre min 3, rif opcional string                                         | nombre, rif                                          |
| PUT /api/asociaciones/:id                                 | nombre min 3, rif string opcional                                         | nombre, rif                                          |
| POST /api/asociaciones/:id/miembros                       | nombre min 2, email, password min 8, rol enum PROPIETARIO/FISCAL          | rol, password                                        |
| PUT /api/asociaciones/:id/miembros/:membresia_id          | nombre min 2, email, password opcional min 8, rol enum PROPIETARIO/FISCAL | membresia_id, rol                                    |
| POST /api/unidades/asociaciones/:id/unidades              | propietario_id int, placa req, numero_unidad req, numero_puestos int      | propietario_id, placa, numero_unidad, numero_puestos |
| POST /api/fiscal/registros                                | unidad_id int, asociacion_id int, pasajeros int opcional                  | unidad_id, asociacion_id, pasajeros                  |
| POST /api/asociaciones/:id/membresias/:membresia_id/state | estado enum ACTIVO/INACTIVO/SUSPENDIDO                                    | estado                                               |
| POST /api/asociaciones/:id/pagos                          | fecha_desde req, fecha_hasta req                                          | fecha_desde, fecha_hasta                             |

## Reglas de coordinacion

1. No cambiar enums de estado o rol sin actualizar formularios y filtros en la app.
2. No endurecer longitudes o required fields sin revisar tsafv-sdk.js y pantallas de alta/edicion.
3. Si cambia la forma de respuesta de asociaciones, miembros, unidades o trazabilidad, actualizar ambas matrices y validar manualmente la app.

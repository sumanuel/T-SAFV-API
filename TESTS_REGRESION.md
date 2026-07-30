# Tests de regresión: T-SAFV-API

Última actualización: 2026-07-30

## Objetivo

Este documento define la suite completa de tests de regresión para T-SAFV-API. Cada test valida comportamiento funcional crítico que debe mantenerse estable entre releases.

## Comandos

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests específicos
npm run test -- auth.test.js

# Tests con coverage
npm run test -- --coverage

# Tests en modo watch
npm run test -- --watch
```

## Estructura de tests

```
tests/
├── root.test.js                    # Health check básico
└── integration/
    ├── auth.test.js                # Autenticación
    ├── asociaciones.test.js        # CRUD asociaciones
    ├── membresias.test.js          # Gestión de miembros
    ├── invitaciones.test.js        # Sistema de invitaciones
    ├── unidades.test.js            # CRUD unidades
    ├── propietarios.test.js        # Listado propietarios
    ├── fiscales.test.js            # Registros fiscales
    ├── traza.test.js               # Trazabilidad
    └── export.test.js              # Exportación Excel
```

---

## 1. Tests de Autenticación

**Archivo**: `tests/integration/auth.test.js`

### T-AUTH-001: Registro exitoso

```js
test("debe registrar un nuevo usuario correctamente", async () => {
  const response = await request(app).post("/api/auth/register").send({
    nombre: "Juan Pérez",
    email: "juan@example.com",
    password: "SecurePass123",
  });

  expect(response.status).toBe(201);
  expect(response.body.user.nombre).toBe("Juan Pérez");
  expect(response.body.user.email).toBe("juan@example.com");
  expect(response.body.user.password).toBeUndefined(); // No exponer password
});
```

### T-AUTH-002: Registro con email duplicado

```js
test("debe fallar registro con email duplicado", async () => {
  // Primer registro
  await request(app).post("/api/auth/register").send({
    nombre: "Juan Pérez",
    email: "juan@example.com",
    password: "SecurePass123",
  });

  // Segundo registro con mismo email
  const response = await request(app).post("/api/auth/register").send({
    nombre: "Otro Usuario",
    email: "juan@example.com",
    password: "OtraPass456",
  });

  expect(response.status).toBe(409);
  expect(response.body.error).toMatch(/email.*ya.*registrado/i);
});
```

### T-AUTH-003: Login exitoso

```js
test("debe hacer login correctamente", async () => {
  // Registrar usuario
  await request(app).post("/api/auth/register").send({
    nombre: "Juan Pérez",
    email: "juan@example.com",
    password: "SecurePass123",
  });

  // Intentar login
  const response = await request(app).post("/api/auth/login").send({
    email: "juan@example.com",
    password: "SecurePass123",
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeDefined();
  expect(response.body.user.email).toBe("juan@example.com");
});
```

### T-AUTH-004: Login con credenciales inválidas

```js
test("debe fallar login con password incorrecto", async () => {
  // Registrar usuario
  await request(app).post("/api/auth/register").send({
    nombre: "Juan Pérez",
    email: "juan@example.com",
    password: "SecurePass123",
  });

  // Intentar login con password incorrecto
  const response = await request(app).post("/api/auth/login").send({
    email: "juan@example.com",
    password: "PasswordIncorrecto",
  });

  expect(response.status).toBe(401);
  expect(response.body.error).toMatch(/credenciales.*inválidas/i);
});
```

### T-AUTH-005: Validar token JWT

```js
test("debe validar token JWT correctamente", async () => {
  // Login
  const loginResponse = await request(app).post("/api/auth/login").send({
    email: "juan@example.com",
    password: "SecurePass123",
  });

  const token = loginResponse.body.token;

  // Usar token en endpoint protegido
  const response = await request(app)
    .get("/api/asociaciones/mine")
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).not.toBe(401);
});
```

### T-AUTH-006: Rechazar token inválido

```js
test("debe rechazar token JWT inválido", async () => {
  const response = await request(app)
    .get("/api/asociaciones/mine")
    .set("Authorization", "Bearer token-invalido-123");

  expect(response.status).toBe(401);
});
```

---

## 2. Tests de Asociaciones

**Archivo**: `tests/integration/asociaciones.test.js`

### T-ASOC-001: Crear asociación

```js
test("debe crear asociación y membresía ADMIN automáticamente", async () => {
  const token = await getAuthToken();

  const response = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Asociación Trans Carabobo",
      rif: "J-12345678-9",
    });

  expect(response.status).toBe(201);
  expect(response.body.nombre).toBe("Asociación Trans Carabobo");
  expect(response.body.id).toBeDefined();
});
```

### T-ASOC-002: Verificar membresía ADMIN automática

```js
test("creador debe tener membresía ADMIN", async () => {
  const token = await getAuthToken();

  // Crear asociación
  const createResponse = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Asociación Trans Carabobo",
      rif: "J-12345678-9",
    });

  const asociacionId = createResponse.body.id;

  // Verificar membresía
  const membersResponse = await request(app)
    .get(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`);

  expect(membersResponse.status).toBe(200);
  const adminMember = membersResponse.body.find((m) => m.rol === "ADMIN");
  expect(adminMember).toBeDefined();
});
```

### T-ASOC-003: Listar mis asociaciones

```js
test("debe listar solo asociaciones del usuario", async () => {
  const token = await getAuthToken();

  // Crear 2 asociaciones
  await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: "Asociación 1", rif: "J-11111111-1" });

  await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: "Asociación 2", rif: "J-22222222-2" });

  // Listar
  const response = await request(app)
    .get("/api/asociaciones/mine")
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(2);
});
```

### T-ASOC-004: Actualizar asociación como ADMIN

```js
test("ADMIN puede actualizar asociación", async () => {
  const token = await getAuthToken();

  // Crear asociación
  const createResponse = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: "Asociación Original", rif: "J-11111111-1" });

  const asociacionId = createResponse.body.id;

  // Actualizar
  const response = await request(app)
    .put(`/api/asociaciones/${asociacionId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nombre: "Asociación Actualizada" });

  expect(response.status).toBe(200);
  expect(response.body.nombre).toBe("Asociación Actualizada");
});
```

### T-ASOC-005: No ADMIN no puede actualizar

```js
test("PROPIETARIO no puede actualizar asociación", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const propietarioToken = await getAuthToken("propietario@example.com");

  // Admin crea asociación
  const createResponse = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ nombre: "Asociación Test", rif: "J-11111111-1" });

  const asociacionId = createResponse.body.id;

  // Agregar propietario a asociación
  await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      nombre: "Propietario Test",
      email: "propietario@example.com",
      password: "Pass123",
      rol: "PROPIETARIO",
    });

  // Propietario intenta actualizar
  const response = await request(app)
    .put(`/api/asociaciones/${asociacionId}`)
    .set("Authorization", `Bearer ${propietarioToken}`)
    .send({ nombre: "Intento de cambio" });

  expect(response.status).toBe(403);
});
```

---

## 3. Tests de Membresías

**Archivo**: `tests/integration/membresias.test.js`

### T-MEM-001: Crear miembro directo

```js
test("ADMIN puede crear miembro directo", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  const response = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Nuevo Propietario",
      email: "propietario@example.com",
      password: "SecurePass123",
      rol: "PROPIETARIO",
    });

  expect(response.status).toBe(201);
  expect(response.body.rol).toBe("PROPIETARIO");
  expect(response.body.estado).toBe("ACTIVO");
});
```

### T-MEM-002: No duplicar emails

```js
test("no debe crear miembro con email duplicado", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  // Primer miembro
  await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Propietario 1",
      email: "mismo@example.com",
      password: "Pass123",
      rol: "PROPIETARIO",
    });

  // Segundo con mismo email
  const response = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Propietario 2",
      email: "mismo@example.com",
      password: "Pass456",
      rol: "PROPIETARIO",
    });

  expect(response.status).toBe(409);
});
```

### T-MEM-003: Actualizar miembro

```js
test("ADMIN puede actualizar datos de miembro", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  // Crear miembro
  const createResponse = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Nombre Original",
      email: "miembro@example.com",
      password: "Pass123",
      rol: "PROPIETARIO",
    });

  const membresiaId = createResponse.body.membresia_id;

  // Actualizar
  const response = await request(app)
    .put(`/api/asociaciones/${asociacionId}/miembros/${membresiaId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Nombre Actualizado",
      rol: "FISCAL",
    });

  expect(response.status).toBe(200);
  expect(response.body.nombre).toBe("Nombre Actualizado");
  expect(response.body.rol).toBe("FISCAL");
});
```

### T-MEM-004: Cambiar estado de membresía

```js
test("ADMIN puede suspender miembro", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  // Crear miembro
  const createResponse = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "Miembro Test",
      email: "miembro@example.com",
      password: "Pass123",
      rol: "PROPIETARIO",
    });

  const membresiaId = createResponse.body.membresia_id;

  // Suspender
  const response = await request(app)
    .post(`/api/asociaciones/${asociacionId}/membresias/${membresiaId}/state`)
    .set("Authorization", `Bearer ${token}`)
    .send({ estado: "SUSPENDIDO" });

  expect(response.status).toBe(200);
  expect(response.body.estado).toBe("SUSPENDIDO");
});
```

---

## 4. Tests de Invitaciones

**Archivo**: `tests/integration/invitaciones.test.js`

### T-INV-001: Crear invitación

```js
test("ADMIN puede crear invitación", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  const response = await request(app)
    .post("/api/invitaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      asociacion_id: asociacionId,
      email_invitado: "invitado@example.com",
      rol_invitado: "PROPIETARIO",
    });

  expect(response.status).toBe(201);
  expect(response.body.token).toBeDefined();
  expect(response.body.estado).toBe("PENDIENTE");
});
```

### T-INV-002: Listar invitaciones

```js
test("ADMIN puede listar invitaciones de su asociación", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  // Crear 2 invitaciones
  await request(app)
    .post("/api/invitaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      asociacion_id: asociacionId,
      email_invitado: "inv1@example.com",
      rol_invitado: "PROPIETARIO",
    });

  await request(app)
    .post("/api/invitaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      asociacion_id: asociacionId,
      email_invitado: "inv2@example.com",
      rol_invitado: "FISCAL",
    });

  // Listar
  const response = await request(app)
    .get(`/api/invitaciones/asociacion/${asociacionId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(2);
});
```

### T-INV-003: Aceptar invitación

```js
test("usuario puede aceptar invitación válida", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const userToken = await getAuthToken("invitado@example.com");
  const asociacionId = await createAsociacion(adminToken);

  // Crear invitación
  const invResponse = await request(app)
    .post("/api/invitaciones")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      asociacion_id: asociacionId,
      email_invitado: "invitado@example.com",
      rol_invitado: "PROPIETARIO",
    });

  const token = invResponse.body.token;

  // Aceptar invitación
  const response = await request(app)
    .post(`/api/invitaciones/${token}/aceptar`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
  expect(response.body.membresia.rol).toBe("PROPIETARIO");
});
```

### T-INV-004: Rechazar invitación

```js
test("usuario puede rechazar invitación", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const userToken = await getAuthToken("invitado@example.com");
  const asociacionId = await createAsociacion(adminToken);

  // Crear invitación
  const invResponse = await request(app)
    .post("/api/invitaciones")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      asociacion_id: asociacionId,
      email_invitado: "invitado@example.com",
      rol_invitado: "PROPIETARIO",
    });

  const token = invResponse.body.token;

  // Rechazar
  const response = await request(app)
    .post(`/api/invitaciones/${token}/rechazar`)
    .set("Authorization", `Bearer ${userToken}`);

  expect(response.status).toBe(200);
});
```

---

## 5. Tests de Unidades

**Archivo**: `tests/integration/unidades.test.js`

### T-UNI-001: Crear unidad

```js
test("ADMIN puede crear unidad", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);
  const propietarioId = await createPropietario(token, asociacionId);

  const response = await request(app)
    .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      propietario_id: propietarioId,
      placa: "ABC-123",
      numero_unidad: "U-042",
      numero_puestos: 35,
      modelo: "Mercedes-Benz 2018",
      color: "Blanco",
    });

  expect(response.status).toBe(201);
  expect(response.body.placa).toBe("ABC-123");
  expect(response.body.numero_unidad).toBe("U-042");
});
```

### T-UNI-002: No duplicar número de unidad

```js
test("no debe permitir número de unidad duplicado", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);
  const propietarioId = await createPropietario(token, asociacionId);

  // Primera unidad
  await request(app)
    .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      propietario_id: propietarioId,
      placa: "ABC-123",
      numero_unidad: "U-042",
      numero_puestos: 35,
    });

  // Segunda unidad con mismo número
  const response = await request(app)
    .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      propietario_id: propietarioId,
      placa: "DEF-456",
      numero_unidad: "U-042",
      numero_puestos: 40,
    });

  expect(response.status).toBe(409);
});
```

### T-UNI-003: Listar unidades de asociación

```js
test("debe listar todas las unidades de la asociación", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);
  const propietarioId = await createPropietario(token, asociacionId);

  // Crear 3 unidades
  for (let i = 1; i <= 3; i++) {
    await request(app)
      .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        propietario_id: propietarioId,
        placa: `ABC-${i}23`,
        numero_unidad: `U-${i}42`,
        numero_puestos: 35,
      });
  }

  // Listar
  const response = await request(app)
    .get(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(3);
});
```

### T-UNI-004: Actualizar unidad

```js
test("ADMIN puede actualizar unidad", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);
  const propietarioId = await createPropietario(token, asociacionId);

  // Crear unidad
  const createResponse = await request(app)
    .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      propietario_id: propietarioId,
      placa: "ABC-123",
      numero_unidad: "U-042",
      numero_puestos: 35,
    });

  const unidadId = createResponse.body.unidad_id;

  // Actualizar
  const response = await request(app)
    .put(`/api/unidades/${unidadId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      numero_puestos: 40,
      color: "Azul",
    });

  expect(response.status).toBe(200);
  expect(response.body.numero_puestos).toBe(40);
  expect(response.body.color).toBe("Azul");
});
```

---

## 6. Tests de Registros Fiscales

**Archivo**: `tests/integration/fiscales.test.js`

### T-FIS-001: Crear registro fiscal

```js
test("FISCAL puede crear registro", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const fiscalToken = await getAuthToken("fiscal@example.com");
  const asociacionId = await createAsociacion(adminToken);

  // Crear fiscal
  await createFiscal(adminToken, asociacionId, "fiscal@example.com");

  // Crear unidad
  const unidadId = await createUnidad(adminToken, asociacionId);

  // Crear registro
  const response = await request(app)
    .post("/api/fiscal/registros")
    .set("Authorization", `Bearer ${fiscalToken}`)
    .send({
      unidad_id: unidadId,
      asociacion_id: asociacionId,
      pasajeros: 28,
      observaciones: "Viaje normal",
    });

  expect(response.status).toBe(201);
  expect(response.body.pasajeros).toBe(28);
});
```

### T-FIS-002: Solo FISCAL puede crear registros

```js
test("PROPIETARIO no puede crear registros fiscales", async () => {
  const propietarioToken = await getAuthToken("propietario@example.com");
  const asociacionId = await createAsociacion(propietarioToken);
  const unidadId = await createUnidad(propietarioToken, asociacionId);

  const response = await request(app)
    .post("/api/fiscal/registros")
    .set("Authorization", `Bearer ${propietarioToken}`)
    .send({
      unidad_id: unidadId,
      asociacion_id: asociacionId,
      pasajeros: 28,
    });

  expect(response.status).toBe(403);
});
```

### T-FIS-003: Listar registros de asociación

```js
test("debe listar registros fiscales de la asociación", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const fiscalToken = await getAuthToken("fiscal@example.com");
  const asociacionId = await createAsociacion(adminToken);
  await createFiscal(adminToken, asociacionId, "fiscal@example.com");
  const unidadId = await createUnidad(adminToken, asociacionId);

  // Crear 5 registros
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/api/fiscal/registros")
      .set("Authorization", `Bearer ${fiscalToken}`)
      .send({
        unidad_id: unidadId,
        asociacion_id: asociacionId,
        pasajeros: 20 + i,
      });
  }

  // Listar
  const response = await request(app)
    .get(`/api/fiscal/registros/asociacion/${asociacionId}`)
    .set("Authorization", `Bearer ${adminToken}`);

  expect(response.status).toBe(200);
  expect(response.body.length).toBe(5);
});
```

---

## 7. Tests de Exportación

**Archivo**: `tests/integration/export.test.js`

### T-EXP-001: Exportar datos a Excel

```js
test("ADMIN puede exportar datos a Excel", async () => {
  const token = await getAuthToken();
  const asociacionId = await createAsociacion(token);

  const response = await request(app)
    .get(`/api/export/asociacion/${asociacionId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.headers["content-type"]).toMatch(/spreadsheet/);
  expect(response.headers["content-disposition"]).toMatch(/\.xlsx$/);
});
```

### T-EXP-002: Solo ADMIN puede exportar

```js
test("PROPIETARIO no puede exportar datos", async () => {
  const adminToken = await getAuthToken("admin@example.com");
  const propietarioToken = await getAuthToken("propietario@example.com");
  const asociacionId = await createAsociacion(adminToken);

  await createPropietario(adminToken, asociacionId, "propietario@example.com");

  const response = await request(app)
    .get(`/api/export/asociacion/${asociacionId}`)
    .set("Authorization", `Bearer ${propietarioToken}`);

  expect(response.status).toBe(403);
});
```

---

## 8. Tests de Seguridad

**Archivo**: `tests/integration/security.test.js`

### T-SEC-001: Rate limiting

```js
test("debe bloquear después de 100 requests en 15 min", async () => {
  const responses = [];

  for (let i = 0; i < 101; i++) {
    const response = await request(app).get("/");
    responses.push(response);
  }

  expect(responses[100].status).toBe(429);
});
```

### T-SEC-002: Sanitización de inputs

```js
test("debe sanitizar inputs maliciosos", async () => {
  const token = await getAuthToken();

  const response = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre: "<script>alert('XSS')</script>",
      rif: "J-12345678-9",
    });

  expect(response.body.nombre).not.toMatch(/<script>/);
});
```

---

## Helpers de test

```js
// tests/helpers.js

async function getAuthToken(email = "test@example.com", password = "Pass123") {
  // Registrar si no existe
  await request(app).post("/api/auth/register").send({
    nombre: "Test User",
    email,
    password,
  });

  // Login
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return response.body.token;
}

async function createAsociacion(token, nombre = "Test Asociación") {
  const response = await request(app)
    .post("/api/asociaciones")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nombre,
      rif: `J-${Date.now()}-9`,
    });

  return response.body.id;
}

async function createPropietario(
  adminToken,
  asociacionId,
  email = "prop@example.com",
) {
  const response = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      nombre: "Propietario Test",
      email,
      password: "Pass123",
      rol: "PROPIETARIO",
    });

  return response.body.usuario_id;
}

async function createFiscal(
  adminToken,
  asociacionId,
  email = "fiscal@example.com",
) {
  const response = await request(app)
    .post(`/api/asociaciones/${asociacionId}/miembros`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      nombre: "Fiscal Test",
      email,
      password: "Pass123",
      rol: "FISCAL",
    });

  return response.body.usuario_id;
}

async function createUnidad(token, asociacionId, propietarioId = null) {
  if (!propietarioId) {
    propietarioId = await createPropietario(token, asociacionId);
  }

  const response = await request(app)
    .post(`/api/unidades/asociaciones/${asociacionId}/unidades`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      propietario_id: propietarioId,
      placa: `ABC-${Date.now() % 1000}`,
      numero_unidad: `U-${Date.now() % 1000}`,
      numero_puestos: 35,
    });

  return response.body.unidad_id;
}

module.exports = {
  getAuthToken,
  createAsociacion,
  createPropietario,
  createFiscal,
  createUnidad,
};
```

---

## Cobertura esperada

| Módulo             | Cobertura mínima |
| ------------------ | ---------------- |
| Autenticación      | 90%              |
| Asociaciones       | 85%              |
| Membresías         | 85%              |
| Invitaciones       | 80%              |
| Unidades           | 85%              |
| Registros fiscales | 80%              |
| Exportación        | 70%              |

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm run migrate
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
      - run: npm run test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
          JWT_SECRET: test-secret
```

---

## Referencias

- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura del sistema
- [SPECS.md](./SPECS.md) - Especificaciones funcionales
- Jest documentation: https://jestjs.io/
- Supertest documentation: https://github.com/visionmedia/supertest

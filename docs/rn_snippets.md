React Native snippets (fetch) — registro, login y aceptar invitación

1. Registro

```javascript
// register.js
export async function register(nombre, email, password) {
  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  return res.json();
}
```

2. Login

```javascript
// login.js
export async function login(email, password) {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  // Save token in secure storage (never AsyncStorage for production)
  return body; // { token, user }
}
```

3. Aceptar invitación (usando token de usuario autenticado y token de invitación)

```javascript
// acceptInvite.js
export async function acceptInvite(authToken, inviteToken) {
  const res = await fetch("http://localhost:3000/api/invitaciones/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: inviteToken }),
  });
  return res.json();
}
```

Notas rápidas:

- Guardar `authToken` en un almacenamiento seguro (Keychain / EncryptedStorage).
- Usar `APP_URL` en producción para abrir enlaces de invitación.

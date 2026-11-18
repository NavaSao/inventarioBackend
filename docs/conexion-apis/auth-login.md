# Guía de Conexión Frontend: POST /api/auth/login

Guía técnica para integración del inicio de sesión desde la aplicación móvil.

---

## Especificación del Endpoint

- **Método:** `POST`
- **Ruta:** `/api/auth/login`
- **Headers Requeridos:**  
  `Content-Type: application/json`

---

## 1. Cuerpo de la Solicitud (Request Body)

```json
{
  "correo": "admin@assetops.com",
  "password": "Password12345!"
}
```

### Reglas de Validación:
- `correo`: Cadena no vacía, formato de email estándar (se normaliza en minúsculas).
- `password`: Cadena no vacía, máximo 72 bytes.

---

## 2. Respuestas del Servidor

### Respuesta Exitosa (`200 OK`)
```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "idUsuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nombre": "Administrador de TI",
      "correo": "admin@assetops.com"
    }
  }
}
```

### Error de Validación (`400 Bad Request`)
```json
{
  "status": "error",
  "message": "Datos de inicio de sesión inválidos",
  "errors": [
    {
      "campo": "correo",
      "mensaje": "El formato del correo es inválido"
    }
  ]
}
```

### Credenciales Incorrectas (`401 Unauthorized`)
```json
{
  "status": "error",
  "message": "Credenciales inválidas o cuenta deshabilitada"
}
```

---

## 3. Ejemplo de Integración en React Native (Fetch / SecureStore)

```javascript
import * as SecureStore from 'expo-secure-store';

async function iniciarSesion(correo, password) {
  const response = await fetch('http://10.0.2.2:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });

  const resJson = await response.json();

  if (!response.ok) {
    throw new Error(resJson.message || 'Error en inicio de sesión');
  }

  // Guardar token de manera persistente y segura
  await SecureStore.setItemAsync('userToken', resJson.data.token);
  return resJson.data.user;
}
```

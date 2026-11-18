# Guía de Conexión Frontend: GET /api/auth/sesion

Guía técnica para validar la sesión guardada al abrir la aplicación móvil.

---

## Especificación del Endpoint

- **Método:** `GET`
- **Ruta:** `/api/auth/sesion` (alias `/api/auth/session`)
- **Headers Requeridos:**  
  `Authorization: Bearer <token>`

---

## 1. Respuestas del Servidor

### Sesión Válida (`200 OK`)
```json
{
  "status": "success",
  "message": "Sesión activa verificada",
  "data": {
    "idUsuario": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Administrador de TI",
    "correo": "admin@assetops.com"
  }
}
```

### Token Ausente o Inválido (`401 Unauthorized`)
```json
{
  "status": "error",
  "message": "Acceso no autorizado: Token inválido o expirado"
}
```

### Sesión Revocada o Usuario Inactivo (`401 Unauthorized`)
```json
{
  "status": "error",
  "message": "Sesión expirada, revocada o usuario inactivo"
}
```

---

## 2. Ejemplo de Integración al Abrir la App (Splash / Guard)

```javascript
import * as SecureStore from 'expo-secure-store';

async function verificarSesionGuardada() {
  const token = await SecureStore.getItemAsync('userToken');
  if (!token) return null;

  const response = await fetch('http://10.0.2.2:3000/api/auth/sesion', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    await SecureStore.deleteItemAsync('userToken'); // Limpiar token revocado o expirado
    return null;
  }

  const resJson = await response.json();
  return resJson.data; // Retorna { idUsuario, nombre, correo }
}
```

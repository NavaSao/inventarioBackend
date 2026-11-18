# Ciclo de Vida: Inicio de Sesión (POST /api/auth/login)

Este documento detalla el recorrido completo de la petición HTTP desde que sale del cliente móvil hasta que retorna el token de acceso.

---

```text
Cliente Móvil (POST)
       ↓
[1] Express Router (src/routes/authRoutes.ts)
       ↓
[2] Validator Middleware (src/validators/authValidator.ts)
    • Verifica con Zod: formato de correo válido y contraseña <= 72 bytes.
    • Si falla: lanza ValidationError (400) -> errorHandler.
       ↓
[3] AuthController.login (src/controllers/AuthController.ts)
    • Instancia LoginCommand(email, password).
    • Invoca loginHandler.handle(command).
       ↓
[4] LoginHandler.handle (src/commands/auth/LoginHandler.ts)
    • Llama a userRepository.findByEmail(email).
    • Llama a authService.verifyPassword(...) con el hash real o el hash de comparación anti-timing attacks.
    • Si las credenciales no coinciden o el usuario está inactivo: lanza BusinessError (401).
    • Llama a tokenService.generateToken(idUsuario, versionSesion).
       ↓
[5] ResponseBuilder.success (src/utils/responseBuilder.ts)
    • Retorna código HTTP 200 con encabezado Cache-Control: no-store y payload con token y datos de usuario.
```

---

## Respuestas Posibles

| Escenario | Código HTTP | Mensaje |
|---|---|---|
| Éxito | `200 OK` | `Inicio de sesión exitoso` (con token) |
| Formato de entrada inválido | `400 Bad Request` | `Datos de inicio de sesión inválidos` (con detalle de campos) |
| Credenciales erróneas o usuario inactivo | `401 Unauthorized` | `Credenciales inválidas o cuenta deshabilitada` |

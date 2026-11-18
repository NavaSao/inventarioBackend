# Ciclo de Vida: Verificación de Sesión (GET /api/auth/sesion)

Recorrido de la petición de validación de sesión activa para clientes móviles.

---

```text
Cliente Móvil (GET con Header Authorization: Bearer <token>)
       ↓
[1] Express Router (src/routes/authRoutes.ts)
       ↓
[2] Auth Middleware (src/middlewares/auth.ts)
    • Extrae el token JWT del header Authorization.
    • Llama a tokenService.verifyToken(token).
    • Si la firma es inválida o expiró: lanza BusinessError (401).
    • Inyecta en el objeto req.user: { idUsuario, versionSesion }.
       ↓
[3] AuthController.consultarSesion (src/controllers/AuthController.ts)
    • Instancia GetSessionQuery(userId, sessionVersion).
    • Invoca getSessionHandler.handle(query).
       ↓
[4] GetSessionHandler.handle (src/queries/auth/GetSessionHandler.ts)
    • Llama a userReadModel.findSessionById(userId, sessionVersion).
    • Aplica las 3 reglas: existe usuario, activo == true, versionSesion coincidente.
    • Si no cumple: lanza BusinessError (401).
       ↓
[5] ResponseBuilder.success (src/utils/responseBuilder.ts)
    • Retorna código HTTP 200 con la información del perfil autenticado.
```

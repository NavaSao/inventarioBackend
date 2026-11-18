# CQRS en el Módulo de Autenticación

El módulo de autenticación de **AssetOps** ilustra con claridad la bifurcación entre Command y Query:

---

## 1. El lado del Comando: Inicio de Sesión
- **Endpoint:** `POST /api/auth/login`
- **Command DTO:** `LoginCommand(email, password)`
- **Handler:** `LoginHandler`
- **Operación:**
  1. Recibe la orden de autenticación.
  2. Consulta la cuenta mediante `UserRepository.findByEmail`.
  3. Ejecuta la comparación criptográfica con `AuthService.verifyPassword` (con compensación de tiempo en caso de usuario inexistente).
  4. Genera el token con `TokenService.generateToken`.
- **Efecto de negocio:** Autoriza y genera una nueva credencial activa en el cliente.

---

## 2. El lado de la Consulta: Verificación de Sesión Activa
- **Endpoint:** `GET /api/auth/sesion` (o `/session`)
- **Query DTO:** `GetSessionQuery(userId, sessionVersion)`
- **Handler:** `GetSessionHandler`
- **Operación:**
  1. No modifica nada en el sistema.
  2. Delega a `UserReadModel.findSessionById`.
  3. Proyecta exclusivamente los campos que el frontend necesita para pintar la interfaz (`idUsuario`, `nombre`, `correo`).
  4. Si la sesión fue revocada (cambio de versión) o el usuario está inactivo, lanza un `BusinessError(401)`.

---

## Comparación Estructural

| Aspecto | `POST /login` (Command) | `GET /sesion` (Query) |
|---|---|---|
| **Verbo HTTP** | POST | GET |
| **DTO de Transporte** | `LoginCommand` | `GetSessionQuery` |
| **Handler** | `LoginHandler` | `GetSessionHandler` |
| **Acceso a Datos** | `UserRepository` | `UserReadModel` |
| **Datos Sensibles** | Valida `passwordHash` | Nunca consulta `passwordHash` |

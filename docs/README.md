# Documentación Técnica del Backend — AssetOps

Bienvenido a la documentación técnica modular de la arquitectura del backend de **AssetOps**.  
Este backend implementa el patrón **CQRS (Command Query Responsibility Segregation)** junto con los principios de diseño **SOLID** y una arquitectura en capas desacoplada por contratos e inyección de dependencias.

---

## Dónde encontrar cada operación

En `src/application`, abre el módulo y luego `commands` para cambios o `queries` para consultas.
Por ejemplo, en [registrar-empleado](../src/application/empleados/commands/registrar-empleado)
están juntos el comando, el handler y el validador. Los contratos de repositorios y servicios
tienen su propio archivo en [`src/domain/contracts`](../src/domain/contracts).

Los controllers siguen en `src/presentation`. Leen la petición, usan la validación
de la operación y llaman al handler.

## 🗺️ Mapa General de Documentación

| Directorio | Propósito | Enlaces |
|---|---|---|
| `docs/SOLID.md` | Justificación y evaluación global de los 5 principios SOLID. | [Leer SOLID.md](./SOLID.md) |
| `docs/cqrs/` | Fundamentos teóricos del patrón CQRS y su aplicación práctica por módulo. | • [Teoría CQRS](./cqrs/cqrs-explicacion.md)<br>• [CQRS en Autenticación](./cqrs/cqrs-auth.md) |
| `docs/solid/` | Análisis detallado de los principios SOLID aplicados al código de cada módulo. | • [Teoría SOLID](./solid/solid-explicacion.md)<br>• [SOLID en Autenticación](./solid/solid-auth.md) |
| `docs/flujos-http/` | Trazas del ciclo de vida de cada petición HTTP (Request -> Controller -> Handler -> DB). | • [Ciclo de Login](./flujos-http/flujo-auth-login.md)<br>• [Ciclo de Consulta de Sesión](./flujos-http/flujo-auth-sesion.md) |
| `docs/conexion-apis/` | Guías técnicas y contratos JSON para el equipo Frontend (Mobile). | • [Endpoint POST /login](./conexion-apis/auth-login.md)<br>• [Endpoint GET /sesion](./conexion-apis/auth-sesion.md) |
| `docs/correo-smtp-hu03-hu06.md` | Documentación completa del servicio SMTP, HU03, HU06, pruebas y evidencias con capturas. | [Leer Correo SMTP (HU03 y HU06)](./correo-smtp-hu03-hu06.md) |

---

## 🏗️ Diagrama de Arquitectura del Sistema (CQRS + SOLID)

```text
               +-------------------------------------------------------+
               |                  HTTP Requests (API)                  |
               +---------------------------+---------------------------+
                                           |
               +---------------------------+---------------------------+
               |                                                       |
     [COMMANDS / ESCRITURA]                                  [QUERIES / LECTURA]
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |  Command Controllers  |                               |   Query Controllers   |
   |   (AuthController)    |                               |   (AuthController)    |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |   Command Handlers    |                               |    Query Handlers     |
   |    (LoginHandler)     |                               |  (GetSessionHandler)  |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |    UserRepository     |                               |     UserReadModel     |
   |      AuthService      |                               |   (Lectura Directa)   |
   |     TokenService      |                               +-----------+-----------+
   +-----------+-----------+                                           |
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                              +-------------------------+
                              |   Prisma / PostgreSQL   |
                              |        (Docker)         |
                              +-------------------------+
```

---

## 🛠️ Tecnologías y Cimientos

- **Lenguaje y Entorno:** Node.js v22+ con TypeScript 5.9 (ES Modules nativos).
- **Servidor HTTP:** Express 5.
- **ORM y Persistencia:** Prisma 7 con adaptador `@prisma/adapter-pg`.
- **Base de Datos:** PostgreSQL 16 ejecutándose en contenedor aislado Docker Compose.
- **Seguridad:** Cifrado de contraseñas con `bcrypt` (costo 12) con protección anti-timing attacks; Tokens de sesión con `jsonwebtoken` (HS256, mínimo 32 bytes de secreto).
- **Validación:** Esquemas tipados con `zod`.
- **Correo y Notificaciones:** Envío SMTP desacoplado con `nodemailer` (compatible con Ethereal Email en pruebas y Gmail/SMTP real en producción).

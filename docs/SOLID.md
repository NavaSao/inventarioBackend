# Justificación de Principios SOLID en AssetOps Backend

Este documento analiza cómo se implementan los 5 principios **SOLID** en el backend de AssetOps.

---

### 1. S — Single Responsibility Principle (Principio de Responsabilidad Única)
> *"Un módulo o clase debe tener una, y solo una, razón para cambiar."*

* **En los Comandos y Consultas:**
  - `LoginCommand` y `GetSessionQuery`: Solo son portadores de datos (DTO). Si cambian las reglas de validación en la API, ellos no cambian.
  - `LoginHandler`: Solo orquesta la verificación y emisión del token. No sabe de Express (`req`, `res`) ni sabe escribir SQL.
  - `GetSessionHandler`: Solo aplica las 3 reglas de validación de sesión activa.
* **En la Persistencia:**
  - `UserRepository`: Encargado de las operaciones de comando y mutación.
  - `UserReadModel`: Encargado exclusivamente de las proyecciones de lectura de sesión.
* **En la Infraestructura:**
  - `TokenService`: Solo se ocupa de la firma y verificación criptográfica de JWT.
  - `AuthService`: Solo se encarga del hashing y comparación segura con bcrypt.

---

### 2. O — Open/Closed Principle (Principio de Abierto/Cerrado)
> *"El software debe estar abierto a la extensión, pero cerrado a la modificación."*

* **Contratos e Inyección:** Los Handlers dependen de `IUserRepository`, `IAuthService` y `ITokenService`.
* Si en el futuro cambiamos el almacenamiento de contraseñas de bcrypt a Argon2, o cambiamos los tokens a RS256 asimétrico, solo creamos una nueva clase que implemente la interfaz correspondiente. `LoginHandler` queda **intacto sin modificar una sola línea**.

---

### 3. L — Liskov Substitution Principle (Principio de Sustitución de Liskov)
> *"Los subtipos deben ser sustituibles por sus tipos base sin alterar el correcto funcionamiento del programa."*

* Cualquier implementación de `IUserRepository` (por ejemplo, un `MockUserRepository` en pruebas unitarias) puede reemplazar al `UserRepository` real de Prisma en el `LoginHandler` sin alterar la lógica de negocio ni provocar excepciones inesperadas.

---

### 4. I — Interface Segregation Principle (Principio de Segregación de Interfaces)
> *"Ningún cliente debe verse forzado a depender de métodos que no utiliza."*

* En lugar de tener una interfaz gigante `IUsuarioServicio` con 20 métodos (crear, buscar, loguear, borrar, cambiar contraseña), se dividieron en contratos específicos y pequeños:
  - `IUserRepository`: métodos para comando y búsqueda con credenciales.
  - `IUserReadModel`: métodos de lectura de proyecciones limpias de usuario.
  - `ITokenService`: solo métodos de tokens.
  - `IAuthService`: solo métodos de contraseñas.

---

### 5. D — Dependency Inversion Principle (Principio de Inversión de Dependencias)
> *"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."*

* `LoginHandler` (lógica de negocio de alto nivel) no hace `import { prisma } from ...`. Depende de la interfaz abstracta `IUserRepository`.
* **Composition Root:** Todas las dependencias concretas se resuelven y ensamblan en un único lugar del sistema: `src/config/container.ts`.

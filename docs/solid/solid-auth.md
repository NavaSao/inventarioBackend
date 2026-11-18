# SOLID en el Módulo de Autenticación

Análisis detallado de cómo cada archivo del módulo de autenticación cumple con SOLID:

---

### `LoginCommand.ts` y `GetSessionQuery.ts`
- **S:** Tienen una única responsabilidad: actuar como DTOs inmutables para transportar los datos desde los controladores hasta los casos de uso. No contienen lógica de negocio ni dependencias de Express o bases de datos.

### `LoginHandler.ts`
- **S:** Su única responsabilidad es el caso de uso de inicio de sesión. No formatea respuestas JSON de Express ni conoce la sintaxis de Prisma.
- **D:** Recibe en su constructor `IUserRepository`, `IAuthService` e `ITokenService`. No instancia clases concretas.

### `GetSessionHandler.ts`
- **S:** Su única responsabilidad es validar el estado de la sesión activa en el modelo de lectura.
- **I:** Depende únicamente de `IUserReadModel`, evitando conocer métodos de escritura o autenticación por contraseña.

### `UserRepository.ts` vs `UserReadModel.ts`
- **S / I:** Separación entre el modelo de persistencia para autenticación y el modelo de proyección para lectura de perfiles. El modelo de lectura está segregado para no exponer columnas sensibles.

### `TokenService.ts`
- **S:** Encapsula estrictamente la lógica de la biblioteca `jsonwebtoken`. Si el algoritmo cambia o el secreto migra a un gestor de secretos (como AWS Secrets Manager o Vault), solo este archivo se modifica.

### `container.ts` (Composition Root)
- **D:** Centraliza la creación e inyección de todas las dependencias concretas, cumpliendo el principio de inversión de dependencias en un único punto del proyecto.

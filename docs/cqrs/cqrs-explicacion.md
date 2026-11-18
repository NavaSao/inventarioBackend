# Fundamentos de la Arquitectura CQRS

## ¿Qué es CQRS?
**CQRS** (*Command Query Responsibility Segregation*) es un patrón de diseño arquitectónico que separa formalmente las operaciones que **modifican datos** (Comandos) de las operaciones que **consultan datos** (Queries).

---

## 1. Commands (Escritura)
- **Propósito:** Ejecutar una intención de cambio de estado o mutación en el sistema.
- **Flujo:** `Controller` ➔ `Command (DTO)` ➔ `CommandHandler` ➔ `Repository` ➔ `Base de Datos`.
- **Características:**
  - Aplican reglas estrictas de negocio y validaciones de seguridad.
  - Devuelven identificadores o resultados de la operación (por ejemplo, el token generado).

## 2. Queries (Lectura)
- **Propósito:** Obtener datos para presentarlos a los clientes sin producir efectos secundarios ni mutaciones en el sistema.
- **Flujo:** `Controller` ➔ `Query (DTO)` ➔ `QueryHandler` ➔ `ReadModel` ➔ `Base de Datos`.
- **Características:**
  - Son idempotentes y seguras de ejecutar repetidamente.
  - Utilizan proyecciones de campos seleccionados (`select`), evitando cargar campos sensibles como contraseñas o hashes.

---

## Ventajas en AssetOps
1. **Modelos optimizados:** No obligamos a la lectura de perfiles a usar las mismas entidades pesadas de mutación.
2. **Seguridad reforzada:** Los modelos de lectura (`UserReadModel`) no tienen acceso a exponer columnas de contraseña.
3. **Escalabilidad y mantenibilidad:** Equipos distintos pueden trabajar en optimizaciones de lectura sin poner en riesgo la lógica de negocio de las transacciones.

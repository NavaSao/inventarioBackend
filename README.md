# Backend de AssetOps Móvil

Base compartida para comenzar el proyecto: PostgreSQL local, las siete tablas aprobadas, sus relaciones y restricciones, conexión con Prisma y carpetas para CQRS.

Cada integrante instala su propia base. GitHub comparte el código y las migraciones para mantener la misma estructura; los registros locales de cada compañero son independientes.

## 1. Requisitos

- Git y VS Code.
- Node.js **26.8.2**, con npm. La versión está indicada en `.nvmrc`.
- Docker Desktop instalado y abierto, usando contenedores Linux.

No hace falta instalar PostgreSQL por separado: Docker lo ejecuta con la versión fijada en `compose.yaml`.

## 2. Descargar el backend

Esta primera entrega está en la rama `codex/base-datos-local`. Hasta que se integre en `dev`, todos pueden descargar exactamente esta base con:

```bash
git clone --branch codex/base-datos-local https://github.com/NavaSao/inventarioBackend.git
cd inventarioBackend
```

Abre esa carpeta en VS Code y usa su terminal. Si ya tienes el repositorio, conserva tus cambios antes de cambiar de rama; no necesitas volver a clonarlo.

Si usas nvm en macOS o Linux, ejecuta `nvm install` y `nvm use`. En Windows selecciona Node 26.8.2 con tu instalación habitual o nvm-windows. Comprueba `node --version` antes de continuar.

## 3. Preparar la configuración local

Copia `.env.example` y llama `.env` a la copia. Puedes hacerlo desde VS Code, o con uno de estos comandos, solo si aún no existe `.env`:

macOS o Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Dentro de `.env`, reemplaza `CAMBIA_ESTA_CLAVE_LOCAL` por tu contraseña local en **ambos lugares**: `POSTGRES_PASSWORD` y `DATABASE_URL`. Para esta instalación sencilla usa letras y números, evitando caracteres que necesiten codificarse en una URL. No modifiques un `.env` que ya funciona.

Valores de conexión de esta base:

| Dato | Valor |
| --- | --- |
| Servidor | `127.0.0.1` |
| Puerto de tu computadora | `5433` |
| Base | `assetops` |
| Usuario de PostgreSQL | `assetops` |
| Contraseña | La que configuraste en tu `.env` |

Este usuario pertenece a PostgreSQL. La cuenta administrativa de la aplicación se configurará al desarrollar el acceso; todavía no hay una cuenta creada.

## 4. Instalar y comprobar

Con Docker Desktop abierto, ejecuta desde la carpeta del backend:

```bash
npm ci
npm run db:setup
npm run typecheck
```

`npm ci` instala las versiones guardadas en `package-lock.json`. `db:setup` inicia PostgreSQL, genera el cliente Prisma, aplica las migraciones pendientes y consulta las siete tablas. Puede volver a ejecutarse: aplica únicamente las migraciones pendientes y conserva los datos.

El resultado debe incluir **Conexión correcta con PostgreSQL.** y una tabla con la cantidad de registros de cada tabla. En una instalación nueva los siete valores son cero.

Las tablas y los datos se conservan en el volumen `postgres_data` de Docker, aunque detengas el servicio. No elimines ese volumen para actualizar el proyecto.

## 5. Entender los archivos

```text
prisma/
  schema.prisma              Las siete tablas, sus campos y relaciones
  migrations/                Instrucciones SQL versionadas para crear y cambiar la base
src/
  database/prisma.ts         Cliente compartido para conectarnos a PostgreSQL
  comprobarConexion.ts       Consulta las siete tablas sin modificar registros
  commands/.gitkeep          Conserva la carpeta de futuras operaciones de escritura
  queries/.gitkeep           Conserva la carpeta de futuras consultas
compose.yaml                 PostgreSQL local y almacenamiento de sus datos
prisma.config.ts             Ubicación del modelo, migraciones y conexión
.env.example                 Plantilla sin contraseñas reales
package.json                 Dependencias y comandos
package-lock.json            Versiones exactas de las dependencias
tsconfig.json                Configuración de TypeScript
```

`src/generated/prisma` se crea con `db:generate`. No se edita a mano ni se sube a GitHub. `node_modules` también se genera al instalar las dependencias.

Para conocer el código, empieza por `schema.prisma`, sigue con `src/database/prisma.ts` y termina con `src/comprobarConexion.ts`.

## 6. Las siete tablas y sus reglas

| Tabla | Qué representa |
| --- | --- |
| Usuarios | Cuentas del único rol: administrador de TI. |
| Empleados | Personas que reciben activos o licencias, sin iniciar sesión. |
| Activos | Equipos, sus datos, ubicación, etiqueta y estado. |
| AsignacionesActivos | Historial de entregas y devoluciones de equipos. |
| Licencias | Contratos de software, vigencia, costo y cupos. |
| AsignacionesLicencias | Historial de cupos asignados a empleados y liberados. |
| Mantenimientos | Inicio y cierre de los servicios de un activo. |

Las llaves conservan los nombres aprobados, por ejemplo `Activos.idActivo` y `AsignacionesActivos.idActivo`. Las relaciones evitan referencias a registros inexistentes y protegen el historial contra eliminaciones de registros relacionados.

La migración ya protege, entre otras condiciones:

- Correos, números de empleado, series y etiquetas sin duplicados en sus tablas correspondientes.
- Una sola asignación abierta por activo, un solo mantenimiento abierto por activo y un solo cupo abierto por licencia y empleado.
- Fechas de cierre coherentes y datos de devolución, liberación o cierre completos.
- Costo no negativo, cupos contratados positivos y fechas de vigencia en orden.
- Fecha y motivo obligatorios cuando un activo está dado de baja.

Los correos deben guardarse en minúsculas y sin espacios en los extremos; números de empleado, series y etiquetas, en mayúsculas y sin esos espacios. La base rechaza formatos incorrectos; no los transforma automáticamente.

Al desarrollar las historias, los comandos deberán comprobar además que el empleado esté activo, que el equipo esté disponible, que no se excedan los cupos y que la licencia esté vigente. También deberán coordinar estados y movimientos en una misma transacción. Estas reglas que relacionan varias tablas todavía no son funciones implementadas.

Prisma añade `_prisma_migrations` para registrar las migraciones aplicadas. Es una tabla técnica.

## 7. Trabajar con CQRS sin agregar capas innecesarias

- `src/commands/`: operaciones que cambian datos, como registrar un empleado o entregar un activo.
- `src/queries/`: operaciones que solo leen datos, como listar activos o consultar su historial.
- Ambas reutilizan el cliente de `src/database/prisma.ts` y la misma base PostgreSQL.

Al comenzar una historia, agrega únicamente sus archivos. Por ejemplo, `commands/empleados/crearEmpleado.ts` y `queries/empleados/listarEmpleados.ts`. Mantén en el comando las validaciones del negocio y los cambios que deban ocurrir juntos.

La base actual cubre la persistencia. Cuando conectemos el frontend, incorporaremos el servidor HTTP con Express y las rutas de cada historia. El acceso, las pantallas y las operaciones del negocio se desarrollarán en esas etapas.

## 8. Mantener al equipo en la misma versión

Proponemos integrar los cambios en `dev` mediante Pull Requests. Esta entrega tiene su propia rama para revisarla antes de integrarla. Evita trabajar directamente en la rama de otro compañero.

Una vez integrada la base en `dev`, empieza una historia con:

```bash
git switch dev
git pull --ff-only origin dev
npm ci
npm run db:setup
git switch -c feature/nombre-de-la-historia
```

Antes de cambiar de rama, guarda tus cambios en tu rama de trabajo. Cuando termines una historia, ejecuta `npm run typecheck` y `npm run db:check`, prueba su comportamiento y comparte un Pull Request hacia `dev`.

Si otro compañero añade una migración, al actualizar ejecuta de nuevo `npm ci` y `npm run db:setup`. Así mantienes la misma estructura sin copiar archivos de la base ni borrar tus registros.

**Solo quien cambia el modelo crea una nueva migración.** Coordinen ese cambio para evitar modificar los mismos campos en paralelo. Después de editar `schema.prisma`, usa:

```bash
npm run db:migrate:dev -- --name descripcion_del_cambio
npm run db:generate
npm run typecheck
npm run db:check
```

Revisa el SQL generado y sube el modelo y la nueva migración en el mismo Pull Request. Algunas restricciones están escritas directamente en SQL: deben conservarse. Si Prisma propone reiniciar una base con datos, detente y revisa la diferencia con el equipo.

No edites migraciones ya compartidas y aplicadas. No uses `db push` o un reinicio de la base como forma de sincronizar al equipo.

Se comparten código, modelo, migraciones, configuración de ejemplo y el archivo de versiones. `.env`, contraseñas, dependencias, cliente generado, fotos cargadas y los datos locales quedan fuera de Git.

## 9. Comandos de uso diario

| Comando | Resultado |
| --- | --- |
| `npm run db:setup` | Prepara o actualiza la base y comprueba las siete tablas. |
| `npm run db:up` | Inicia PostgreSQL. |
| `npm run db:down` | Detiene PostgreSQL conservando los datos. |
| `npm run db:status` | Muestra el estado del servicio. |
| `npm run db:check` | Comprueba la conexión y cuenta los registros de las siete tablas. |
| `npm run db:generate` | Regenera el cliente después de un cambio del modelo. |
| `npm run db:migrate` | Aplica las migraciones existentes. |
| `npm run db:migrate:dev -- --name descripcion` | Crea y aplica una migración durante el desarrollo. |
| `npm run db:studio` | Inicia el visor de tablas en el puerto 5555. |
| `npm run typecheck` | Revisa los tipos de TypeScript. |

Para explorar las tablas, ejecuta `npm run db:studio` y abre la dirección que aparece en la terminal. Usa Ctrl+C para cerrar el visor.

## 10. Problemas frecuentes

| Situación | Qué revisar |
| --- | --- |
| Docker no responde | Abre Docker Desktop y espera a que termine de iniciar. |
| El puerto 5433 está ocupado | Cambia `POSTGRES_PORT` y el puerto de `DATABASE_URL` al mismo número libre. |
| Error de contraseña | Revisa que coincida en ambos lugares de `.env`. Si la base ya existía, utiliza la contraseña con la que se creó: editar `.env` no cambia la contraseña almacenada en PostgreSQL. |
| Faltan tablas | Ejecuta `npm run db:setup` para aplicar las migraciones. |
| Falta el cliente generado | Ejecuta `npm run db:generate`. |
| Hay errores de versión de Node | Comprueba que usas Node 26.8.2 y vuelve a ejecutar `npm ci`. |

La instalación se comprueba cuando `db:check` puede consultar las siete tablas y `typecheck` termina sin errores.

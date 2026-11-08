# AssetOps Móvil — Backend

Equipo, esta es la base con la que vamos a empezar el backend. Les dejo esta guía para que cada quien pueda preparar su computadora, entender los archivos y trabajar con la misma estructura.

Vamos a usar `main` como nuestra versión compartida. Cada quien tendrá su propia base de datos local: compartimos el código y las migraciones por GitHub, pero los registros que guardemos en nuestras computadoras son independientes.

## 1. Qué tenemos en esta base

Ya tenemos PostgreSQL en Docker, las siete tablas aprobadas con sus relaciones y restricciones, la conexión con Prisma y una comprobación que consulta todas las tablas. También dejamos las carpetas `commands` y `queries` para desarrollar las historias con CQRS.

En el primer sprint agregué el servidor con Express y el inicio de sesión. Cada integrante crea su cuenta de prueba en su propia base.

Usamos estas herramientas:

| Herramienta | Para qué la ocupamos |
| --- | --- |
| Node.js y TypeScript | Ejecutar las herramientas y escribir el código del backend. |
| PostgreSQL | Guardar la información de la aplicación. |
| Docker Compose | Ejecutar la misma versión de PostgreSQL en cada computadora. |
| Prisma | Definir el modelo, aplicar migraciones y consultar la base desde TypeScript. |
| Git y GitHub | Compartir y revisar los cambios del proyecto. |

## 2. Preparar nuestra computadora

Antes de comenzar necesitamos:

- Git.
- VS Code.
- Node.js **26.8.2**, con npm.
- Docker Desktop instalado y abierto, usando contenedores Linux.

No necesitamos instalar PostgreSQL por separado. Docker lo ejecutará con la versión definida en `compose.yaml`.

Para comprobar Node y las herramientas podemos ejecutar:

```bash
node --version
npm --version
git --version
docker compose version
```

Node debe mostrar `v26.8.2`. Si usamos nvm en macOS o Linux, dentro del proyecto podemos ejecutar `nvm install` y `nvm use` para tomar la versión de `.nvmrc`. En Windows podemos instalar esa versión directamente o seleccionarla con nvm-windows.

## 3. Descargar el proyecto desde main

Para una instalación nueva:

```bash
git clone --branch main https://github.com/NavaSao/inventarioBackend.git
cd inventarioBackend
```

Después abrimos la carpeta `inventarioBackend` en VS Code. Todos los comandos de esta guía se ejecutan desde esa carpeta, donde está `package.json`.

Si ya tienen el repositorio, no hace falta clonarlo otra vez. Primero guarden sus cambios en su rama de trabajo y después actualicen:

```bash
git switch main
git pull --ff-only origin main
```

## 4. Crear nuestro archivo .env

Dentro del proyecto está `.env.example`. Cada quien debe hacer una copia llamada `.env`.

Podemos copiarlo desde VS Code o usar uno de estos comandos, solamente si todavía no tenemos `.env`:

macOS o Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Luego abrimos `.env` y cambiamos `CAMBIA_ESTA_CLAVE_LOCAL` por nuestra contraseña local en los dos lugares: `POSTGRES_PASSWORD` y `DATABASE_URL`.

```env
POSTGRES_USER=assetops
POSTGRES_PASSWORD=CAMBIA_ESTA_CLAVE_LOCAL
POSTGRES_DB=assetops
POSTGRES_PORT=5433
DATABASE_URL=postgresql://assetops:CAMBIA_ESTA_CLAVE_LOCAL@127.0.0.1:5433/assetops?schema=public
```

Para esta configuración sencilla podemos usar una contraseña local de letras y números, evitando caracteres que necesiten codificarse dentro de la URL. Cada quien puede tener una contraseña diferente; en su propio archivo debe coincidir en ambos lugares.

La conexión apunta a la base `assetops`, en nuestra computadora (`127.0.0.1`), por el puerto `5433`. El usuario `assetops` pertenece a PostgreSQL; es distinto del administrador que después entrará a la aplicación.

`.env` queda fuera de Git. Compartimos `.env.example` para que todos conozcamos qué variables configurar. Si ya tienen un `.env` funcionando, consérvenlo.

## 5. Instalar y levantar la base

Con Docker Desktop abierto y `.env` configurado:

```bash
npm ci
npm run db:setup
npm run typecheck
```

Esto es lo que hace cada comando:

| Comando | Qué pasa al ejecutarlo |
| --- | --- |
| `npm ci` | Instala las versiones guardadas en `package-lock.json`. |
| `npm run db:setup` | Inicia PostgreSQL, genera el cliente Prisma, aplica las migraciones pendientes y consulta las siete tablas. |
| `npm run typecheck` | Revisa que el código TypeScript no tenga errores de tipos. |

Al terminar `db:setup` debemos ver **Conexión correcta con PostgreSQL.** y una tabla con el número de registros de cada tabla. En una instalación nueva, los siete valores son cero. `typecheck` debe terminar sin errores.

Podemos volver a ejecutar `db:setup` para actualizar el entorno: aplica las migraciones pendientes y conserva los registros existentes. Los datos permanecen en el volumen de Docker aunque detengamos PostgreSQL.

### Probar el login del sprint 1

En su `.env`, pongan un correo en `ADMIN_CORREO`, una contraseña de prueba en `ADMIN_PASSWORD` (de 12 caracteres como mínimo y hasta 72 bytes) y una clave aleatoria propia en `JWT_SECRET`. Pueden generar la clave con este comando y copiar el resultado a su `.env`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Una vez configurado su `.env`, creen la cuenta y arranquen el servidor:

```bash
npm run admin:crear
npm run dev
```

Si la cuenta ya existe, `admin:crear` la conserva. Para una prueba desde el celular en la misma red, configuren `HOST=0.0.0.0` y usen la IP de la computadora en la app.

Envíen `POST http://127.0.0.1:3000/api/auth/login` con `Content-Type: application/json` y el correo y la contraseña que configuraron:

```json
{ "correo": "admin@assetops.test", "password": "su-contraseña-local" }
```

- `200` devuelve `{ "token": "..." }`.
- `400` indica que hay que corregir los datos.
- `401` devuelve `{ "mensaje": "Acceso inválido" }` para una clave incorrecta, una cuenta inactiva o un correo que no existe.

Para la validación de sesión, el JWT lleva el ID de la cuenta en `sub`, `versionSesion` y un vencimiento de una hora. La firma usa `HS256` con la clave local del backend. Durante el sprint, abrimos los Pull Requests de cada tarea hacia `sprint-1`.

### Probar la validación de sesión del sprint 1

Para consultar si la sesión guardada sigue activa, envíen `GET http://127.0.0.1:3000/api/auth/session` con la cabecera `Authorization: Bearer <token>`:

- `200` devuelve los datos de la cuenta: `{ "idUsuario": "...", "nombre": "...", "correo": "..." }`.
- `401` devuelve error si el token expiró, la firma no coincide, la cuenta está inactiva o la versión de sesión cambió.


## 6. Ver las tablas y usar la base cada día

Para explorar las tablas desde el navegador:

```bash
npm run db:studio
```

Abrimos la dirección que aparezca en la terminal. Prisma Studio nos permite ver y editar registros; cualquier edición que hagamos ahí afecta nuestra base local. Para cerrar Studio usamos Ctrl+C en esa terminal.

Para detener PostgreSQL conservando los datos:

```bash
npm run db:down
```

Cuando volvamos a trabajar, abrimos Docker Desktop y ejecutamos:

```bash
npm run db:up
npm run db:check
```

No necesitamos reinstalar las dependencias cada vez que abrimos VS Code. Lo hacemos al preparar el proyecto o cuando actualizamos dependencias compartidas.

## 7. Qué hace cada parte del proyecto

```text
prisma/
  schema.prisma              Modelo de las siete tablas y sus relaciones
  migrations/                SQL para crear y actualizar la estructura
src/
  commands/.gitkeep          Carpeta inicial para operaciones que cambian datos
  queries/.gitkeep           Carpeta inicial para operaciones de lectura
  database/prisma.ts         Cliente compartido de conexión
  comprobarConexion.ts       Comprueba la conexión consultando las siete tablas
.env.example                 Plantilla de configuración local
compose.yaml                 PostgreSQL en Docker y almacenamiento de sus datos
prisma.config.ts             Configuración de las herramientas de Prisma
package.json                 Dependencias y comandos del proyecto
package-lock.json            Versiones exactas de las dependencias
tsconfig.json                Configuración de TypeScript
.gitignore                   Archivos que dejamos fuera de Git
.gitattributes               Finales de línea consistentes entre computadoras
.nvmrc                       Versión de Node para nvm
.npmrc                       Configuración de npm para guardar versiones exactas
README.md                    Esta guía
```

Estos son los archivos principales que conviene revisar en orden:

| Archivo | Cómo lo manejamos |
| --- | --- |
| `prisma/schema.prisma` | Aquí vemos campos, llaves y relaciones. Si acordamos cambiar la estructura, editamos el modelo y creamos una nueva migración. |
| `prisma/migrations/` | Compartimos estas instrucciones para que todos creemos la misma estructura. No editamos migraciones que ya se compartieron y aplicaron. |
| `prisma.config.ts` | Indica dónde están el modelo y las migraciones, y obtiene `DATABASE_URL` para los comandos de Prisma. |
| `src/database/prisma.ts` | Lee la conexión de `.env` y exporta `prisma`. Lo reutilizaremos desde los comandos y consultas. |
| `src/comprobarConexion.ts` | Cuenta los registros de las siete tablas, muestra los resultados y cierra la conexión al terminar. No modifica registros. |
| `compose.yaml` | Define la versión de PostgreSQL, el puerto, la configuración y el volumen donde se guardan los datos. |
| `package.json` | Reúne los comandos que usamos en esta guía y las dependencias que necesita el proyecto. |

El recorrido de nuestra comprobación es:

```text
npm run db:check
        ↓
src/comprobarConexion.ts
        ↓
src/database/prisma.ts
        ↓
Cliente Prisma y adaptador PostgreSQL
        ↓
PostgreSQL en Docker
```

Al instalar aparecen `node_modules` y `src/generated/prisma`. Son archivos de dependencias y código generado; no los editamos a mano ni los subimos al repositorio. El cliente se reconstruye con `npm run db:generate`. Los archivos `.gitkeep` solo permiten conservar las carpetas vacías en Git.

## 8. Cómo está organizada la base de datos

| Tabla | Qué guardamos |
| --- | --- |
| Usuarios | Las cuentas del único rol: administrador de TI. |
| Empleados | Las personas que reciben activos o licencias; no necesitan iniciar sesión. |
| Activos | Los equipos, su etiqueta, sus datos y su estado. |
| AsignacionesActivos | Las entregas y devoluciones de equipos, conservando el historial. |
| Licencias | Los contratos de software, su vigencia, costo y cupos. |
| AsignacionesLicencias | Los cupos asignados a empleados y sus liberaciones. |
| Mantenimientos | Los servicios de un activo, desde su inicio hasta su cierre. |

Conservamos los nombres aprobados de las llaves. Por ejemplo, `Activos.idActivo` se relaciona con `AsignacionesActivos.idActivo`. Las relaciones evitan referencias a registros inexistentes y restringen la eliminación de registros que tienen movimientos relacionados.

La base ya protege condiciones como estas:

- Correos, números de empleado, series y etiquetas sin duplicados en sus tablas correspondientes.
- Una sola asignación abierta por activo y un solo mantenimiento abierto por activo.
- Un solo cupo abierto por contrato de licencia y empleado.
- Fechas coherentes y datos completos para cerrar devoluciones, liberaciones y mantenimientos.
- Cupos contratados positivos, costo no negativo y vigencia en orden.
- Fecha y motivo obligatorios cuando un activo está dado de baja.

Los correos deben guardarse en minúsculas y sin espacios en los extremos. Los números de empleado, series y etiquetas deben ir en mayúsculas y sin esos espacios. La base rechaza formatos incorrectos; no los corrige automáticamente.

Al implementar las historias agregaremos en los comandos las comprobaciones que requieren revisar varias tablas: empleado activo, equipo disponible, vigencia, cupos y desactivación de empleados con asignaciones abiertas. También coordinaremos los cambios de estado y sus movimientos en una misma transacción.

Prisma añade `_prisma_migrations` para registrar qué migraciones se aplicaron. Es una tabla técnica, además de las siete tablas del proyecto.

## 9. Cómo vamos a usar CQRS

Vamos a separar las operaciones según lo que hacen:

| Carpeta | Qué agregamos ahí | Ejemplo |
| --- | --- | --- |
| `src/commands/` | Funciones que cambian información. | Registrar un empleado o entregar un activo. |
| `src/queries/` | Funciones que leen información. | Listar activos o consultar un historial. |
| `src/database/` | La conexión que reutilizan ambas. | El cliente `prisma`. |

Cuando empecemos una historia, creamos únicamente los archivos que necesitemos. Por ejemplo:

```text
src/commands/empleados/crearEmpleado.ts
src/queries/empleados/listarEmpleados.ts
```

Son ejemplos de organización; esos archivos todavía no existen. Los comandos contendrán las reglas del negocio y las transacciones que correspondan. Las consultas recuperarán datos sin cambiar registros del negocio. Ambos usarán la misma base PostgreSQL.

## 10. Cómo compartir nuestros avances

`main` será el punto de partida común. Para mantenerlo funcionando, propongo que cada historia se trabaje en una rama propia y se integre mediante un Pull Request hacia `main`, después de revisarla.

Antes de empezar una historia, guardamos nuestros cambios pendientes y actualizamos:

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run db:setup
git switch -c feature/registro-empleados
```

El nombre `feature/registro-empleados` es un ejemplo; cada quien usará uno relacionado con su tarea. Así empezamos desde la última base compartida y trabajamos en nuestra propia rama.

Al terminar, comprobamos lo que hicimos:

```bash
npm run typecheck
npm run db:check
```

Además probamos el comportamiento de nuestra historia. Estos dos comandos revisan los tipos y el acceso a las tablas; no prueban por sí solos todas las reglas de una función nueva.

Después revisamos qué archivos vamos a compartir, guardamos el cambio y publicamos nuestra rama:

```bash
git status
git diff
git add .
git commit -m "Agrega registro de empleados"
git push -u origin feature/registro-empleados
```

En GitHub abrimos un Pull Request con `main` como destino y nuestra rama como origen. Describimos qué cambió y cómo lo comprobamos. Después de revisar e integrar el cambio, los demás actualizan `main` y vuelven a ejecutar `npm ci` y `npm run db:setup`.

## 11. Qué hacemos cuando cambia la estructura

Primero acordamos el cambio con el equipo. Solo quien modifica el modelo crea la nueva migración; los demás la aplican al actualizar el proyecto.

Después de editar `prisma/schema.prisma`, quien hace el cambio ejecuta:

```bash
npm run db:migrate:dev -- --name descripcion_del_cambio
npm run db:generate
npm run typecheck
npm run db:check
```

Revisamos el SQL generado y compartimos el modelo y la nueva migración en el mismo Pull Request. Algunas restricciones están escritas directamente en SQL y deben conservarse. Si Prisma propone reiniciar una base con datos, revisamos la diferencia antes de aceptar.

Los demás, después de descargar el cambio integrado, ejecutan:

```bash
npm ci
npm run db:setup
```

No copiamos tablas a mano ni borramos el volumen para ponernos al día. No editamos migraciones que ya se aplicaron y no usamos `db push` para sincronizar al equipo.

## 12. Qué compartimos en GitHub

Compartimos código, modelo, migraciones, esta guía, configuración de ejemplo y archivos de dependencias. Así cada quien puede reconstruir el entorno.

Dejamos fuera `.env`, contraseñas, datos locales, fotos cargadas, `node_modules`, `dist` y `src/generated/prisma`. `.gitignore` ya contempla esas exclusiones.

## 13. Comandos a la mano

| Comando | Para qué lo usamos |
| --- | --- |
| `npm ci` | Instalar las dependencias con las versiones compartidas. |
| `npm run db:setup` | Preparar o actualizar la base y comprobar las siete tablas. |
| `npm run db:up` | Iniciar PostgreSQL. |
| `npm run db:down` | Detener PostgreSQL conservando los datos. |
| `npm run db:status` | Ver el estado del servicio. |
| `npm run db:check` | Comprobar la conexión y contar los registros. |
| `npm run db:generate` | Regenerar el cliente Prisma. |
| `npm run db:migrate` | Aplicar las migraciones existentes. |
| `npm run db:migrate:dev -- --name descripcion` | Crear y aplicar una migración durante el desarrollo. |
| `npm run db:studio` | Abrir el visor de tablas en el puerto 5555. |
| `npm run typecheck` | Revisar los tipos del código. |

## 14. Si algo no funciona

| Problema | Qué podemos revisar |
| --- | --- |
| Docker no responde | Abrimos Docker Desktop y esperamos a que termine de iniciar. |
| El puerto 5433 está ocupado | Cambiamos `POSTGRES_PORT` y el puerto de `DATABASE_URL` al mismo número libre. |
| PostgreSQL rechaza la contraseña | Revisamos que coincida en ambos lugares de `.env`. Si la base ya existía, usamos la contraseña con la que se creó: editar `.env` no cambia la contraseña guardada en PostgreSQL. |
| Faltan tablas | Ejecutamos `npm run db:setup` para aplicar las migraciones. |
| Falta el cliente generado | Ejecutamos `npm run db:generate`. |
| Hay errores de versión de Node | Comprobamos que usamos Node 26.8.2 y ejecutamos `npm ci` otra vez. |
| No podemos cambiar de rama porque hay cambios pendientes | Guardamos nuestros cambios en nuestra rama antes de cambiar; no los descartamos para continuar. |

Cuando las siete tablas se puedan consultar y `typecheck` termine sin errores, tendremos lista esta base para empezar nuestras historias.

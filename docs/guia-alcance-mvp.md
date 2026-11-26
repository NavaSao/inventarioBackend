# Guía del alcance MVP · AssetOps Móvil

Esta guía explica cómo cumple el sistema cada punto de *Incluido en el Alcance* del Project Charter.

**Arquitectura (sin cambios):**
- Backend: `Route → Controller → Handler (Command/Query) → Contrato de dominio ← Repositorio Prisma`.
- App: `View → ViewModel (hook) → Service → ApiClient`.
- Las dependencias se ensamblan solo en `container.ts` (backend) y en `App.tsx` (app).

## 1. Autenticación
- `POST /api/auth/login` devuelve un JWT con duración de 1 h. La app lo guarda con `expo-secure-store` (`ExpoSecureStorage`).
- Para revocar las sesiones, `versionSesion` se incrementa con el logout global. Así `guardiaSesionActiva` rechaza los tokens anteriores.
- **Expiración automática:** `SesionHttpClient` (decorador de `IHttpClient`) vigila cada petición autenticada. Si recibe un `401`, llama a `cerrarSesion()` y la app vuelve al login.
- El usuario cierra sesión desde la pestaña **Empleados**, con el botón «Cerrar sesión».

## 2. Catálogo de Empleados
| Acción | Endpoint | Pantalla |
|---|---|---|
| Consultar y buscar | `GET /api/empleados` | `EmpleadosScreen` (búsqueda por nombre, correo o área) |
| Alta | `POST /api/empleados` | `EmpleadoFormScreen` (correo de bienvenida opcional) |
| Edición | `PUT /api/empleados/:id` | Al tocar un empleado de la lista |
| Desactivación | `PATCH /api/empleados/:id/desactivar` | Botón «Desactivar empleado» |

Regla: el sistema no desactiva a un empleado que tenga **licencias o equipos** asignados (`409`).

## 3. Inventario de Hardware
- `POST /api/activos` registra un activo y `PUT /api/activos/:id` lo edita.
- Campos obligatorios: nombre, **número de serie único**, **etiqueta UUID única**, categoría y ubicación. Marca y modelo son opcionales.
- Fotografía: en `ActivoFormScreen` se toma con `CamaraModal` (modo `foto`) y se envía en base64 a `PUT /api/activos/:id/foto`.
  - El backend valida que sea JPEG y la guarda en `uploads/activos/` (`LocalFotoStorage`).
  - La foto se sirve en `/uploads`.
- Un número de serie o etiqueta duplicados se rechazan con `409`.

## 4. Módulo de Escaneo Móvil
- En la pestaña **Equipos**, el botón «Escanear etiqueta» abre `CamaraModal` (modo `escaner`) con marco de lectura. Lee QR y códigos de barras.
- La app consulta `GET /api/activos/etiqueta/:uuid`:
  - **Existe** → abre la ficha del activo.
  - **No existe (404)** → abre «Nuevo equipo» con la etiqueta ya capturada.
- Ante un error de red se muestra el mensaje con «Reintentar», y la app no se cierra.

## 5. Ciclo de Asignaciones y Devoluciones
- **Equipos:** desde la ficha, «Asignar a empleado» → selector de empleados activos → `POST /api/activos/:id/asignar`. «Registrar devolución» → `POST /api/activos/:id/devolver`, que deja el activo en `DISPONIBLE`.
- **Licencias** (ya existía): asignar en `POST /api/licencias/:id/asignar` y liberar un cupo en `POST /api/licencias/asignaciones/:id/liberar`.

## 6. Mantenimiento Completo
- «Enviar a mantenimiento» pide una **nota obligatoria** (`NotaModal` y Zod) → `POST /api/activos/:id/mantenimiento` → `EN_MANTENIMIENTO`.
- «Cerrar mantenimiento» (resolución opcional) → `POST /api/activos/:id/mantenimiento/cerrar` → `DISPONIBLE`.

### Máquina de estados del activo
Está en el dominio (`TRANSICIONES` y `validarTransicion` en `domain/models/Activo.ts`):

```
DISPONIBLE --asignar--> ASIGNADO --devolver--> DISPONIBLE
DISPONIBLE --mantenimiento--> EN_MANTENIMIENTO --cerrar--> DISPONIBLE
```

- Un activo en mantenimiento **no puede asignarse** (`409`).
- Cada transición se ejecuta en una transacción. El cambio de estado es condicional (`updateMany where estado = origen`), así que dos dispositivos no pueden mover el mismo equipo a la vez.

## 7. Control de Licencias
- `POST /api/licencias` registra el software, el plan, las fechas de vigencia, los **cupos contratados** y el **costo/moneda**.
- Asignar con cupos agotados o con la licencia vencida se bloquea en el backend.

## 8. Dashboard Inicial
`GET /api/dashboard` devuelve:
- `activosPorEstado`: se muestra en la tarjeta «Equipos por estado». Al tocarla, la app abre la pestaña Equipos.
- `vencimientosMenos30Dias`: licencias vigentes a las que les quedan **menos de 30 días**. Se muestran como alertas ámbar con «Revisar licencia».
- Métricas de cupos y actividad reciente.

## Puesta en marcha
1. Backend:
   ```
   npm run db:setup
   npm run dev
   ```
   No hacen falta migraciones nuevas: las tablas `Activos`, `AsignacionesActivos` y `Mantenimientos` ya existían.
2. App:
   ```
   npx expo start
   ```
   - La cámara requiere un dispositivo físico o un emulador con cámara.
   - Se usa `expo-camera`, que viene incluido en Expo Go.
   - Para apuntar a otra IP, usa `EXPO_PUBLIC_API_URL=http://<ip>:3000`.
3. Pruebas:
   - Backend: `npm test`. La suite `tests/activos` cubre el ciclo de estados y las validaciones.
   - App: `npx jest` y `npm test`.

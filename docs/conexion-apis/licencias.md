# API de Licencias (HU05, HU06 y HU07)

Todas las rutas requieren `Authorization: Bearer <token>` con una sesión activa.
El formato de respuesta es `{ status, message, data }` para éxitos y `{ status, message, errors? }` para errores.

| Método y ruta | Qué hace |
| --- | --- |
| `POST /api/licencias` | Registra una contratación y devuelve el detalle básico con `201`. |
| `GET /api/licencias` | Lista el catálogo con los cupos por licencia. Acepta `busqueda` por software o código y `estado` con `TODAS`, `VIGENTE`, `POR_VENCER` o `VENCIDA`. |
| `GET /api/licencias/:idLicencia` | Consulta una licencia por su UUID y agrega `empleadosAsignados` con el ID de cada asignación abierta y su historial. |
| `GET /api/licencias/:idLicencia/asignar/previsualizacion?idEmpleado=...` | Previsualiza el Paso 2 de asignación: valida reglas de negocio y calcula `cuposLibresResultantes` y ocupación resultante. |
| `POST /api/licencias/:idLicencia/asignar` | Asigna un cupo en transacción atómica (`201`), soporta `claveAsignacion` / cabecera `Idempotency-Key` para reintentos (`200`) y envía notificación SMTP. |
| `POST /api/licencias/asignaciones/:idAsignacionLicencia/liberar` | Libera una asignación abierta conservando historial (`200`). Acepta `fechaLiberacion`, `claveLiberacion` / `Idempotency-Key` y `nota`. Permite liberar contratos vencidos sin habilitar nuevas asignaciones. |
| `POST /api/licencias/:idLicencia/liberar` | Libera una asignación abierta por `idLicencia` + `idEmpleado` en el cuerpo. |
| `GET /api/licencias/:idLicencia/historial` | Consulta el historial completo de movimientos (`ACTIVA` y `LIBERADA`) de la licencia. |

## Ejemplo de alta

```json
{
  "codigoLicencia": "FIG-ORG-2026",
  "software": "Figma",
  "plan": "Organization",
  "periodicidad": "Anual",
  "inicioVigencia": "2026-11-01",
  "finVigencia": "2027-11-01",
  "cuposContratados": 16
}
```

El código visible se guarda en mayúsculas y es único. Para la ruta de detalle se usa
`idLicencia`, el UUID de la respuesta. El proveedor y la referencia de contrato son opcionales.
Si se captura `costo`, se envía junto con `moneda`, por ejemplo `"125.00"` y `"MXN"`.
La API devuelve las fechas de vigencia como `AAAA-MM-DD`.

## Cupos y estados

- `cuposAsignados` cuenta las asignaciones abiertas. `cuposLibres` es el saldo respecto a los contratados.
- `cuposAsignables` es cero si el contrato está vencido o aún no empieza.
- `POR_VENCER` corresponde a entre 1 y 29 días. En la fecha de vencimiento el estado es `VENCIDA`.
- `400` indica datos inválidos, `401` sesión inválida, `404` licencia inexistente y `409` código duplicado.

Ejecuta `npm run db:migrate` y `npm run db:generate` después de actualizar la rama.
La migración también agrega `cargo` a Empleados para que el módulo HU03 use el mismo esquema.

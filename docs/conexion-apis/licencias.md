# API de Licencias (HU05)

Las tres rutas requieren `Authorization: Bearer <token>` con una sesión activa.
El formato de respuesta es `{ status, message, data }` para éxitos y `{ status, message, errors? }` para errores.

| Método y ruta | Qué hace |
| --- | --- |
| `POST /api/licencias` | Registra una contratación y devuelve el detalle básico con `201`. |
| `GET /api/licencias` | Lista el catálogo con los cupos por licencia. Acepta `busqueda` por software o código y `estado` con `TODAS`, `VIGENTE`, `POR_VENCER` o `VENCIDA`. |
| `GET /api/licencias/:idLicencia` | Consulta una licencia por su UUID y agrega `empleadosAsignados` con el ID de cada asignación abierta. |

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

/**
 * Query para consultar el historial completo de asignaciones y liberaciones de una licencia (HU07).
 */
export class GetLicenseHistoryQuery {
  constructor(public readonly idLicencia: string) {}
}


export interface PreviewLicenseAssignmentInput {
  idLicencia: string;
  idEmpleado: string;
}

/**
 * Query para previsualizar el Paso 2 del flujo guiado de asignación de licencias (HU06 - Escenario 06.01).
 */
export class PreviewLicenseAssignmentQuery {
  constructor(public readonly payload: PreviewLicenseAssignmentInput) {}
}


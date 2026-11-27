import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { PreviewLicenseAssignmentQuery } from '../../application/licencias/queries/previsualizar-asignacion/PreviewLicenseAssignmentQuery.js';
import type { PreviewLicenseAssignmentQueryHandler } from '../../application/licencias/queries/previsualizar-asignacion/PreviewLicenseAssignmentQueryHandler.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { licenciaMovimientoParamSchema } from '../../application/licencias/validacionMovimiento.js';
import { previewAssignLicenseQuerySchema } from '../../application/licencias/queries/previsualizar-asignacion/PreviewLicenseAssignmentValidator.js';

/**
 * Single Action Controller para previsualización del Paso 2 de asignación de licencia (HU06 - Escenario 06.01).
 */
export class PreviewLicenseAssignmentController {
  constructor(private readonly handler: PreviewLicenseAssignmentQueryHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params = licenciaMovimientoParamSchema.parse(req.params);
      const queryParams = previewAssignLicenseQuerySchema.parse(req.query);

      const preview = await this.handler.handle(
        new PreviewLicenseAssignmentQuery({
          idLicencia: params.idLicencia,
          idEmpleado: queryParams.idEmpleado,
        }),
      );

      ResponseBuilder.success(res, preview, 'Previsualización de asignación calculada', 200);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Parámetros de previsualización inválidos', error.issues));
        return;
      }
      next(error);
    }
  };
}


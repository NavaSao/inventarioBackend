import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ReleaseLicenseCommand } from '../../application/commands/licencias/ReleaseLicenseCommand.js';
import type { ReleaseLicenseCommandHandler } from '../../application/commands/licencias/ReleaseLicenseCommandHandler.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import {
  extractIdempotencyKey,
  releaseLicenseBodySchema,
  releaseLicenseParamSchema,
} from '../validators/licenseAssignmentValidator.js';

/**
 * Single Action Controller para Liberación de Licencias (HU07).
 * Una única acción pública execute.
 */
export class ReleaseLicenseController {
  constructor(private readonly handler: ReleaseLicenseCommandHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.idUsuario) {
        throw new BusinessError('Acceso no autorizado: Se requiere sesión activa', 401);
      }

      const params = releaseLicenseParamSchema.parse(req.params);
      const body = releaseLicenseBodySchema.parse(req.body);
      const headerKey = extractIdempotencyKey(req.headers as Record<string, unknown> | undefined);

      const command = new ReleaseLicenseCommand({
        idAsignacionLicencia: params.idAsignacionLicencia,
        idLicencia: params.idLicencia,
        idEmpleado: body.idEmpleado,
        idUsuarioLiberacion: req.user.idUsuario,
        claveLiberacion: body.claveLiberacion ?? headerKey,
        fechaLiberacion: body.fechaLiberacion,
        nota: body.nota,
      });

      const resultado = await this.handler.handle(command);
      const message = resultado.reintentoRecuperado
        ? 'Movimiento de liberación recuperado exitosamente'
        : 'Licencia liberada exitosamente';
      ResponseBuilder.success(res, resultado, message, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Datos de liberación inválidos', error.issues));
        return;
      }
      next(error);
    }
  };
}

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AssignLicenseCommand } from '../../application/commands/licencias/AssignLicenseCommand.js';
import type { AssignLicenseCommandHandler } from '../../application/commands/licencias/AssignLicenseCommandHandler.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import {
  assignLicenseBodySchema,
  assignLicenseParamSchema,
} from '../validators/licenseAssignmentValidator.js';

/**
 * Single Action Controller para Asignación de Licencias (HU06).
 * Una única acción pública execute, delegando la orquestación al Command Handler.
 */
export class AssignLicenseController {
  constructor(private readonly handler: AssignLicenseCommandHandler) {}

  execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.idUsuario) {
        throw new BusinessError('Acceso no autorizado: Se requiere sesión activa', 401);
      }

      const params = assignLicenseParamSchema.parse(req.params);
      const body = assignLicenseBodySchema.parse(req.body);

      const command = new AssignLicenseCommand({
        idLicencia: params.idLicencia,
        idEmpleado: body.idEmpleado,
        idUsuarioAsignacion: req.user.idUsuario,
        nota: body.nota,
      });

      const resultado = await this.handler.handle(command);
      ResponseBuilder.success(res, resultado, 'Licencia asignada exitosamente', 201);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Datos de asignación inválidos', error.issues));
        return;
      }
      next(error);
    }
  };
}

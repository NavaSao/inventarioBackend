import type { Request, Response, NextFunction } from 'express';
import { LoginCommand } from '../../application/auth/commands/login/LoginCommand.js';
import type { LoginCommandHandler } from '../../application/auth/commands/login/LoginCommandHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';

/**
 * Single Action Controller para el Inicio de Sesión (POST /api/auth/login).
 * Cumple SRP: una única función pública, delegando la lógica al LoginCommandHandler.
 */
export class LoginController {
  constructor(private readonly loginCommandHandler: LoginCommandHandler) {}

  public execute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { correo, password } = req.body;
      const command = new LoginCommand(correo, password);
      const result = await this.loginCommandHandler.handle(command);

      res.set('Cache-Control', 'no-store');
      ResponseBuilder.success(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  };
}

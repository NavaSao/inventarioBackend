import type { Request, Response, NextFunction } from 'express';
import { LoginCommand } from '../../application/commands/auth/LoginCommand.js';
import { GetSessionQuery } from '../../application/queries/auth/GetSessionQuery.js';
import type { LoginHandler } from '../../application/commands/auth/LoginHandler.js';
import type { GetSessionHandler } from '../../application/queries/auth/GetSessionHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';

export interface AuthControllerDeps {
  loginHandler: LoginHandler;
  getSessionHandler: GetSessionHandler;
}

export const authControllerFactory = ({ loginHandler, getSessionHandler }: AuthControllerDeps) => ({
  // Command: POST /api/auth/login
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { correo, password } = req.body;
      const command = new LoginCommand(correo, password);
      const result = await loginHandler.handle(command);

      res.set('Cache-Control', 'no-store');
      ResponseBuilder.success(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  },

  // Query: GET /api/auth/sesion o /session
  consultarSesion: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BusinessError('Usuario no autenticado en la solicitud', 401);
      }

      const query = new GetSessionQuery(req.user.idUsuario, req.user.versionSesion);
      const session = await getSessionHandler.handle(query);

      ResponseBuilder.success(res, session, 'Sesión activa verificada');
    } catch (error) {
      next(error);
    }
  },
});

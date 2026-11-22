import type { Request, Response, NextFunction } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import { LoginCommand } from '../../application/commands/auth/LoginCommand.js';
import { GetSessionQuery } from '../../application/queries/auth/GetSessionQuery.js';
import type { ILoginHandler } from '../../application/commands/auth/LoginHandler.js';
import type { IGetSessionHandler } from '../../application/queries/auth/GetSessionHandler.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import type { LoginBody } from '../validators/authValidator.js';

export interface AuthControllerDeps {
  loginHandler: ILoginHandler;
  getSessionHandler: IGetSessionHandler;
}

export const authControllerFactory = ({ loginHandler, getSessionHandler }: AuthControllerDeps) => ({
  // Command: POST /api/auth/login
  login: async (
    req: Request<ParamsDictionary, unknown, LoginBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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

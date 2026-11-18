import type { RequestHandler } from 'express';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from '../commands/auth/LoginCommand.js';
import type { ICommandBus } from '../core/cqrs/command.interface.js';
import type { IQueryBus } from '../core/cqrs/query.interface.js';
import { BusinessError } from '../exceptions/BusinessError.js';
import { ObtenerSesionQuery } from '../queries/auth/GetSessionQuery.js';
import type { DatosSesion } from '../queries/auth/sesion.dto.js';
import { responder } from '../utils/responseBuilder.js';
import type { Credenciales } from '../validators/authValidator.js';

export function crearAuthController(commandBus: ICommandBus, queryBus: IQueryBus) {
  const login: RequestHandler = async (req, res) => {
    const { correo, password }: Credenciales = req.body;
    const resultado = await commandBus.ejecutar<ResultadoIniciarSesion | null>(
      new IniciarSesionCommand(correo, password)
    );

    if (!resultado) {
      throw new BusinessError(401, 'Acceso inválido');
    }

    res.set('Cache-Control', 'no-store');
    responder(res, 200, 'Inicio de sesión correcto', resultado);
  };

  const consultarSesion: RequestHandler = async (req, res) => {
    if (!req.user) {
      throw new BusinessError(401, 'Acceso no autorizado');
    }

    const { sub, versionSesion } = req.user;
    const usuario = await queryBus.consultar<DatosSesion | null>(
      new ObtenerSesionQuery(sub, versionSesion)
    );
    if (!usuario) {
      throw new BusinessError(401, 'Sesión revocada o cuenta inactiva');
    }

    responder(res, 200, 'Sesión activa', usuario);
  };

  return { login, consultarSesion };
}

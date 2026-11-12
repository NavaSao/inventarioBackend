import type { Request, Response } from 'express';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from '../commands/auth/iniciarSesion.command.js';
import { ObtenerSesionQuery } from '../queries/auth/obtenerSesion.query.js';
import type { DatosSesion } from '../queries/auth/sesion.dto.js';
import type { ICommandBus } from '../core/cqrs/command.interface.js';
import type { IQueryBus } from '../core/cqrs/query.interface.js';
import type { ITokenService } from '../core/interfaces/tokenService.interface.js';
import { credencialesSchema } from './credenciales.js';
import { obtenerContenedor } from '../container.js';

export class AuthController {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus,
    private readonly tokenService: ITokenService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    const entrada = credencialesSchema.safeParse(req.body);
    if (!entrada.success) {
      res.status(400).json({ mensaje: 'Revisa el correo y la contraseña' });
      return;
    }

    const { correo, password } = entrada.data;
    const resultado = await this.commandBus.ejecutar<ResultadoIniciarSesion | null>(
      new IniciarSesionCommand(correo, password)
    );

    // Respondo igual si la cuenta está inactiva, falta o la contraseña es incorrecta.
    if (!resultado) {
      res.status(401).json({ mensaje: 'Acceso inválido' });
      return;
    }

    res.set('Cache-Control', 'no-store').json({ token: resultado.token });
  }

  async consultarSesion(req: Request, res: Response): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      res.status(401).json({ mensaje: 'Acceso no autorizado' });
      return;
    }

    // Revisa la firma y el vencimiento mediante el servicio de tokens
    const payload = this.tokenService.verificarToken(token);
    if (!payload) {
      res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
      return;
    }

    // Consulta los datos de la sesión activa mediante el QueryBus
    const usuario = await this.queryBus.consultar<DatosSesion | null>(
      new ObtenerSesionQuery(payload.sub, payload.versionSesion)
    );

    if (!usuario) {
      res.status(401).json({ mensaje: 'Sesión revocada o cuenta inactiva' });
      return;
    }

    res.status(200).json(usuario);
  }
}

// Instancia por defecto conectada al contenedor para los enrutadores de Express
let controladorPorDefecto: AuthController | null = null;

function obtenerControladorAuth(): AuthController {
  if (!controladorPorDefecto) {
    const contenedor = obtenerContenedor();
    controladorPorDefecto = new AuthController(
      contenedor.commandBus,
      contenedor.queryBus,
      contenedor.tokenService
    );
  }
  return controladorPorDefecto;
}

export const login = (req: Request, res: Response): Promise<void> =>
  obtenerControladorAuth().login(req, res);

export const consultarSesion = (req: Request, res: Response): Promise<void> =>
  obtenerControladorAuth().consultarSesion(req, res);

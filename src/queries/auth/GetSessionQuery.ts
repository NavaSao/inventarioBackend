import type { IQuery } from '../../core/cqrs/query.interface.js';

export class ObtenerSesionQuery implements IQuery {
  static readonly tipo = 'auth.obtenerSesion';
  readonly tipo = ObtenerSesionQuery.tipo;

  constructor(
    public readonly idUsuario: string,
    public readonly versionSesion: number
  ) {}
}

export interface User {
  readonly idUsuario: string;
  readonly nombre: string;
  readonly correo: string;
  readonly activo: boolean;
  readonly versionSesion: number;
}

export interface User {
  idUsuario: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  versionSesion: number;
  creadoEn: Date;
  actualizadoEn: Date;
}

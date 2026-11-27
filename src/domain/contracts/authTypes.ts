export interface UserAuthEntity {
  idUsuario: string;
  nombre: string;
  correo: string;
  passwordHash: string;
  activo: boolean;
  versionSesion: number;
}

export interface UserSessionDTO {
  idUsuario: string;
  nombre: string;
  correo: string;
}

export interface UserSessionState extends UserSessionDTO {
  activo: boolean;
  versionSesion: number;
}

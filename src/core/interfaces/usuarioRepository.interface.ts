export interface UsuarioAuthDto {
  readonly idUsuario: string;
  readonly nombre: string;
  readonly correo: string;
  readonly passwordHash: string;
  readonly activo: boolean;
  readonly versionSesion: number;
}

export interface UsuarioSesionDto {
  readonly idUsuario: string;
  readonly nombre: string;
  readonly correo: string;
  readonly activo: boolean;
  readonly versionSesion: number;
}

export interface CrearUsuarioInput {
  readonly nombre: string;
  readonly correo: string;
  readonly passwordHash: string;
}

export interface IUsuarioReadRepository {
  buscarPorCorreo(correo: string): Promise<UsuarioAuthDto | null>;
  buscarPorId(idUsuario: string): Promise<UsuarioSesionDto | null>;
}

export interface IUsuarioWriteRepository {
  crear(datos: CrearUsuarioInput): Promise<boolean>;
}

export interface IUsuarioRepository extends IUsuarioReadRepository, IUsuarioWriteRepository {}

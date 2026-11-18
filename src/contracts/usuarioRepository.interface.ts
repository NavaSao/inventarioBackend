import type { User } from '../models/User.js';

export interface UsuarioAuthDto extends User {
  readonly passwordHash: string;
}

export type UsuarioSesionDto = User;

export interface CrearUsuarioInput {
  readonly nombre: string;
  readonly correo: string;
  readonly passwordHash: string;
}

export interface IUsuarioLoginRepository {
  buscarPorCorreo(correo: string): Promise<UsuarioAuthDto | null>;
}

export interface IUsuarioReadRepository {
  buscarPorId(idUsuario: string): Promise<UsuarioSesionDto | null>;
}

export interface IUsuarioWriteRepository {
  crear(datos: CrearUsuarioInput): Promise<boolean>;
}

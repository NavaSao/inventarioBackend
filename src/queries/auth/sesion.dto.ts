import type { User } from '../../models/User.js';

export type DatosSesion = Pick<User, 'idUsuario' | 'nombre' | 'correo'>;

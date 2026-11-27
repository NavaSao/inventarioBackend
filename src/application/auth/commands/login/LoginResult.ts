export interface LoginResult {
  token: string;
  user: {
    idUsuario: string;
    nombre: string;
    correo: string;
  };
}

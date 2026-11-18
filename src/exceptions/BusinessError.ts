export class BusinessError extends Error {
  constructor(readonly status: 401 | 404, mensaje: string) {
    super(mensaje);
  }
}

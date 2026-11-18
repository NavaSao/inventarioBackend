export class ValidationError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(message = 'Error de validación de datos', errors: unknown[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

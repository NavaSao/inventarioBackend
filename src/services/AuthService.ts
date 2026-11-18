import bcrypt from 'bcrypt';
import type { IPasswordHasher } from '../contracts/passwordHasher.interface.js';

// Hash bcrypt de costo 12 para realizar una comparación aunque el usuario no exista.
const hashDeComparacion = '$2b$12$e8YkYg4Z88yO0yMfZ6VzVuKzX6bHqLqLpC3J8b5xM1Y7wP2q9tZ.u';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly costo: number = 12) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.costo);
  }

  async compare(password: string, hash: string | null): Promise<boolean> {
    return bcrypt.compare(password, hash ?? hashDeComparacion);
  }
}

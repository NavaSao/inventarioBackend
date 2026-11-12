import bcrypt from 'bcrypt';
import type { IPasswordHasher } from '../../core/interfaces/passwordHasher.interface.js';

export class BcryptPasswordHasher implements IPasswordHasher {
  constructor(private readonly costo: number = 12) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.costo);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

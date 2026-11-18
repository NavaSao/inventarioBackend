import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { IAuthService } from '../../domain/contracts/index.js';

export const BCRYPT_ROUNDS = 12;

export class AuthService implements IAuthService {
  private comparisonHashPromise: Promise<string>;

  constructor() {
    this.comparisonHashPromise = bcrypt.hash(randomBytes(24).toString('hex'), BCRYPT_ROUNDS);
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  async getComparisonHash(): Promise<string> {
    return this.comparisonHashPromise;
  }
}

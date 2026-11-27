import type { LoginCommand } from './LoginCommand.js';
import type { LoginResult } from './LoginResult.js';

export interface ILoginHandler {
  handle(command: LoginCommand): Promise<LoginResult>;
}

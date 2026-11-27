import type { UserSessionDTO } from '../../../../domain/contracts/index.js';
import type { GetSessionQuery } from './GetSessionQuery.js';

export interface IGetSessionHandler {
  handle(query: GetSessionQuery): Promise<UserSessionDTO>;
}

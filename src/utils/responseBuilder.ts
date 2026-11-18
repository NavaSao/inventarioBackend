import type { Response } from 'express';

export function responder(res: Response, status: number, message: string, data: unknown = null): void {
  res.status(status).json({ status, message, data });
}

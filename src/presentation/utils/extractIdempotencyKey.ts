import { z } from 'zod';

const optionalUuidHeader = z
  .string()
  .trim()
  .uuid({ message: 'La clave de idempotencia (Idempotency-Key) debe ser un UUID válido' })
  .optional();

export function extractIdempotencyKey(headers?: Record<string, unknown>): string | undefined {
  const raw = headers?.['idempotency-key'];
  if (raw === undefined) return undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return optionalUuidHeader.parse(value);
}

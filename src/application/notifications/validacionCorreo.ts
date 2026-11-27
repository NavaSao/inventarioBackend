import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('El formato del correo electrónico es inválido'));

export const optionalNonEmptyString = z.string().trim().min(1).optional();

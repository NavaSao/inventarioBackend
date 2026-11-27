import { z } from 'zod';

export const loginSchema = z
  .object({
    correo: z.string().trim().toLowerCase().pipe(z.email('El formato del correo es inválido')).optional(),
    email: z.string().trim().toLowerCase().pipe(z.email('El formato del correo es inválido')).optional(),
    password: z
      .string()
      .min(1, 'La contraseña no puede estar vacía')
      .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'La contraseña no puede exceder 72 bytes'),
  })
  .refine((data) => Boolean(data.correo || data.email), {
    message: 'El correo electrónico es requerido',
    path: ['correo'],
  })
  .transform((data) => ({
    correo: (data.correo || data.email) as string,
    password: data.password,
  }));

export type LoginBody = z.infer<typeof loginSchema>;

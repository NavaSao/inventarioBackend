import { z } from 'zod';

export const costoBcrypt = 12;

export const credencialesSchema = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email()),
  // Mido la contraseña en bytes porque bcrypt solo procesa los primeros 72.
  password: z.string().min(1).refine((valor) => Buffer.byteLength(valor, 'utf8') <= 72),
});

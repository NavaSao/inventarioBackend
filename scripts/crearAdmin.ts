import 'dotenv/config';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../src/infrastructure/config/database.js';
import { BCRYPT_ROUNDS } from '../src/infrastructure/services/AuthService.js';

const esquema = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).refine((v) => Buffer.byteLength(v, 'utf8') <= 72),
});

async function crearAdmin(): Promise<void> {
  const entrada = esquema.safeParse({
    correo: process.env.ADMIN_CORREO,
    password: process.env.ADMIN_PASSWORD,
  });

  if (!entrada.success) {
    console.error('Configura ADMIN_CORREO y una ADMIN_PASSWORD de al menos 12 caracteres y hasta 72 bytes.');
    process.exitCode = 1;
    return;
  }

  const { correo, password } = entrada.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { count } = await prisma.usuario.createMany({
    data: [
      { nombre: 'Administrador de TI', correo, passwordHash },
      { nombre: 'Administrador de TI', correo: 'admin@assetops.com', passwordHash },
    ],
    skipDuplicates: true,
  });

  console.log(count ? `Se crearon ${count} cuenta(s) administrativa(s).` : 'Las cuentas ya existen.');
}

try {
  await crearAdmin();
} catch (error) {
  console.error('No se pudo crear la cuenta. Comprueba la conexión:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

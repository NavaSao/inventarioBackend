import 'dotenv/config';
import bcrypt from 'bcrypt';
import { costoBcrypt, credencialesSchema } from '../auth/credenciales.js';
import { prisma } from '../database/prisma.js';

async function crearAdmin(): Promise<void> {
  const entrada = credencialesSchema.safeParse({
    correo: process.env.ADMIN_CORREO,
    password: process.env.ADMIN_PASSWORD,
  });
  if (!entrada.success || entrada.data.password.length < 12) {
    console.error('Configura ADMIN_CORREO y una ADMIN_PASSWORD de al menos 12 caracteres y hasta 72 bytes.');
    process.exitCode = 1;
    return;
  }

  const { correo, password } = entrada.data;
  const passwordHash = await bcrypt.hash(password, costoBcrypt);

  // Si vuelvo a correr el comando con el mismo correo, conservo la cuenta que ya existe.
  const { count } = await prisma.usuario.createMany({
    data: [{ nombre: 'Administrador de TI', correo, passwordHash }],
    skipDuplicates: true,
  });

  console.log(count ? 'Cuenta administrativa creada.' : 'La cuenta ya existe.');
}

try {
  await crearAdmin();
} catch {
  console.error('No se pudo crear la cuenta. Comprueba la conexión y ejecuta npm run db:setup.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

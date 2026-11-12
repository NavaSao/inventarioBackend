import 'dotenv/config';
import { credencialesSchema } from '../auth/credenciales.js';
import { CrearAdminCommand, type ResultadoCrearAdmin } from '../commands/usuarios/crearAdmin.command.js';
import { obtenerContenedor } from '../container.js';

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
  const { commandBus } = obtenerContenedor();

  const { creado } = await commandBus.ejecutar<ResultadoCrearAdmin>(
    new CrearAdminCommand('Administrador de TI', correo, password)
  );

  console.log(creado ? 'Cuenta administrativa creada.' : 'La cuenta ya existe.');
}

const { prisma } = obtenerContenedor();
try {
  await crearAdmin();
} catch {
  console.error('No se pudo crear la cuenta. Comprueba la conexión y ejecuta npm run db:setup.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

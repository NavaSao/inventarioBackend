import 'dotenv/config';
import { crearApp } from './app.js';
import { crearContenedor } from './config/container.js';

const host = process.env.HOST || '127.0.0.1';
const puerto = Number(process.env.PORT || 3000);
const { prisma, rutasAuth } = crearContenedor();

try {
  await prisma.$queryRaw`SELECT 1`;
} catch {
  console.error('No se pudo conectar a PostgreSQL. Revisa la configuración y ejecuta npm run db:setup.');
  await prisma.$disconnect();
  process.exit(1);
}

const app = crearApp(rutasAuth);
app.listen(puerto, host, () => console.log(`API disponible en http://${host}:${puerto}`));

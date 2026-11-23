import 'dotenv/config';
import app from './src/app.js';
import { prisma } from './src/infrastructure/config/database.js';
import { mailConfig } from './src/infrastructure/config/mail.js';

const puerto = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

async function startServer(): Promise<void> {
  console.log('\n[*] Iniciando servicios de AssetOps Backend (Clean Architecture + CQRS)...');

  let dbStatus = 'Desconectado';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Conectado exitosamente a PostgreSQL (Docker)';
  } catch (err) {
    dbStatus = `Advertencia en base de datos: ${err instanceof Error ? err.message : String(err)}`;
  }

  app.listen(puerto, host, () => {
    const smtpStatus = mailConfig.isConfigured
      ? `Configurado (${mailConfig.host}:${mailConfig.port})`
      : 'Sin credenciales SMTP en .env (envío opcional en modo seguro)';

    console.log('\n======================================================');
    console.log('       ASSETOPS BACKEND EN LÍNEA (4 CAPAS + CQRS)      ');
    console.log('======================================================');
    console.log(`[*] Base de Datos : ${dbStatus}`);
    console.log(`[*] Servicio SMTP : ${smtpStatus}`);
    console.log(`[*] Servidor Local: http://${host}:${puerto}`);
    console.log(`[*] Health Check  : http://${host}:${puerto}/health`);
    console.log(`[*] Auth API      : http://${host}:${puerto}/api/auth`);
    console.log(`[*] Licencias API : http://${host}:${puerto}/api/licencias`);
    console.log(`[*] Mail API      : http://${host}:${puerto}/api/notificaciones`);
    console.log('======================================================\n');
  });
}

startServer();

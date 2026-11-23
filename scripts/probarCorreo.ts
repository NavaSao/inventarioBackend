import 'dotenv/config';
import nodemailer from 'nodemailer';
import { loadMailConfig, type MailConfig } from '../src/infrastructure/config/mail.js';
import { NodemailerMailService } from '../src/infrastructure/services/NodemailerMailService.js';
import { MailTemplateRenderer } from '../src/infrastructure/services/MailTemplateRenderer.js';
import { SendWelcomeEmailCommand } from '../src/application/commands/notifications/SendWelcomeEmailCommand.js';
import { SendWelcomeEmailHandler } from '../src/application/commands/notifications/SendWelcomeEmailHandler.js';
import { SendAssignmentNoticeCommand } from '../src/application/commands/notifications/SendAssignmentNoticeCommand.js';
import { SendAssignmentNoticeHandler } from '../src/application/commands/notifications/SendAssignmentNoticeHandler.js';

function getCliArg(prefix: string): string | undefined {
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : undefined;
}

async function resolveMailConfig(): Promise<{ config: MailConfig; usingEphemeralEthereal: boolean }> {
  const forceEthereal = process.argv.includes('--ethereal');
  const envConfig = loadMailConfig();

  if (!forceEthereal && envConfig.isConfigured) {
    return { config: envConfig, usingEphemeralEthereal: false };
  }

  console.log(
    forceEthereal
      ? '[*] Modo --ethereal solicitado: creando cuenta SMTP temporal en Ethereal Email...'
      : '[*] Credenciales SMTP_USER/SMTP_PASS vacías en .env: creando cuenta SMTP temporal en Ethereal Email para la prueba...',
  );

  const testAccount = await nodemailer.createTestAccount();
  console.log(`[*] Cuenta Ethereal generada: ${testAccount.user}`);
  console.log(`[*] Host SMTP Ethereal     : ${testAccount.smtp.host}:${testAccount.smtp.port}`);

  return {
    usingEphemeralEthereal: true,
    config: {
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      user: testAccount.user,
      pass: testAccount.pass,
      from: envConfig.from || `AssetOps TI <${testAccount.user}>`,
      welcomeEnabledByDefault: envConfig.welcomeEnabledByDefault,
      testRecipient: envConfig.testRecipient || testAccount.user,
      isConfigured: true,
    },
  };
}

async function ejecutarVerificacion(): Promise<void> {
  console.log('\n==============================================================');
  console.log('   VERIFICACIÓN SMTP — ASSETOPS BACKEND (HU03 y HU06)         ');
  console.log('==============================================================\n');

  const { config, usingEphemeralEthereal } = await resolveMailConfig();
  const destinatario = getCliArg('--to=') || config.testRecipient || config.user;

  const mailService = new NodemailerMailService(config);
  const templateRenderer = new MailTemplateRenderer();
  const welcomeHandler = new SendWelcomeEmailHandler(mailService, templateRenderer, {
    welcomeEnabledByDefault: config.welcomeEnabledByDefault,
  });
  const assignmentHandler = new SendAssignmentNoticeHandler(mailService, templateRenderer);

  // 1. Verificar conexión SMTP
  console.log(`[*] Verificando conexión SMTP (${config.host}:${config.port}, secure=${config.secure})...`);
  await mailService.verifyConnection();
  console.log('[OK] Conexión y autenticación SMTP verificadas correctamente.\n');

  // 2. Probar HU03 opcional desactivado (no debe enviar)
  const skippedResult = await welcomeHandler.handle(
    new SendWelcomeEmailCommand('Usuario Omitido', destinatario, 'EMPLEADO', false),
  );
  console.log(`[HU03 - Opcional desactivado] status=${skippedResult.status}, sent=${skippedResult.sent}`);

  // 3. Probar HU03 correo de bienvenida enviado
  const welcomeResult = await welcomeHandler.handle(
    new SendWelcomeEmailCommand(
      'Ana López (Prueba HU03)',
      destinatario,
      'EMPLEADO',
      true,
      'EMP-2026-042',
      'Desarrollo Móvil',
    ),
  );
  console.log(`[HU03 - Bienvenida enviada]   status=${welcomeResult.status}, messageId=${welcomeResult.messageId}`);
  if (welcomeResult.previewUrl) {
    console.log(`      Vista previa Ethereal -> ${welcomeResult.previewUrl}`);
  }

  // 4. Probar HU06 aviso automático de asignación de ACTIVO
  const assetNoticeResult = await assignmentHandler.handle(
    new SendAssignmentNoticeCommand({
      tipo: 'ACTIVO',
      nombreEmpleado: 'Ana López (Prueba HU06)',
      correoEmpleado: destinatario,
      numeroEmpleado: 'EMP-2026-042',
      departamento: 'Desarrollo Móvil',
      fechaAsignacion: new Date(),
      asignadoPor: 'Administrador de TI',
      nota: 'Entrega verificada con cargador original y funda protectora.',
      detalle: {
        nombreActivo: 'MacBook Pro 14"',
        etiqueta: 'AST-LAP-014',
        numeroSerie: 'C02YM298LVDL',
        categoria: 'Laptop',
        ubicacion: 'Edificio A - Piso 3',
        marca: 'Apple',
        modelo: 'M3 Pro',
      },
    }),
  );
  console.log(`[HU06 - Aviso Activo]         status=${assetNoticeResult.status}, messageId=${assetNoticeResult.messageId}`);
  if (assetNoticeResult.previewUrl) {
    console.log(`      Vista previa Ethereal -> ${assetNoticeResult.previewUrl}`);
  }

  // 5. Probar HU06 aviso automático de asignación de LICENCIA
  const licenseNoticeResult = await assignmentHandler.handle(
    new SendAssignmentNoticeCommand({
      tipo: 'LICENCIA',
      nombreEmpleado: 'Ana López (Prueba HU06)',
      correoEmpleado: destinatario,
      numeroEmpleado: 'EMP-2026-042',
      departamento: 'Desarrollo Móvil',
      fechaAsignacion: new Date(),
      asignadoPor: 'Administrador de TI',
      nota: 'Licencia asignada para herramientas de diseño y colaboración.',
      detalle: {
        software: 'Figma Organization',
        proveedor: 'Figma Inc.',
        referenciaContrato: 'LIC-FIG-2026-09',
        inicioVigencia: '2026-01-15',
        finVigencia: '2027-01-14',
      },
    }),
  );
  console.log(`[HU06 - Aviso Licencia]       status=${licenseNoticeResult.status}, messageId=${licenseNoticeResult.messageId}`);
  if (licenseNoticeResult.previewUrl) {
    console.log(`      Vista previa Ethereal -> ${licenseNoticeResult.previewUrl}`);
  }

  // 6. Probar resiliencia ante fallo SMTP (no debe lanzar excepción ni tumbar el proceso)
  const unconfiguredService = new NodemailerMailService({
    ...config,
    isConfigured: false,
  });
  const resilientWelcomeHandler = new SendWelcomeEmailHandler(unconfiguredService, templateRenderer);
  const failedGracefully = await resilientWelcomeHandler.handle(
    new SendWelcomeEmailCommand('Prueba Resiliencia', destinatario, 'USUARIO', true),
  );
  console.log(
    `[Resiliencia SMTP]            status=${failedGracefully.status}, sent=${failedGracefully.sent} (sin caída del flujo)`,
  );

  const resumen = [
    { Prueba: 'HU03 Opcional (skip)', Estado: skippedResult.status, Enviado: skippedResult.sent },
    { Prueba: 'HU03 Bienvenida', Estado: welcomeResult.status, Enviado: welcomeResult.sent },
    { Prueba: 'HU06 Aviso Activo', Estado: assetNoticeResult.status, Enviado: assetNoticeResult.sent },
    { Prueba: 'HU06 Aviso Licencia', Estado: licenseNoticeResult.status, Enviado: licenseNoticeResult.sent },
    { Prueba: 'Resiliencia sin SMTP', Estado: failedGracefully.status, Enviado: failedGracefully.sent },
  ];

  console.log('\nResumen de verificación:');
  console.table(resumen);

  const ok =
    skippedResult.status === 'SKIPPED' &&
    welcomeResult.sent &&
    assetNoticeResult.sent &&
    licenseNoticeResult.sent &&
    failedGracefully.status === 'FAILED';

  if (!ok) {
    process.exitCode = 1;
    console.error('\n[ERROR] Alguna de las comprobaciones de correo no pasó. Revisa la salida superior.');
    return;
  }

  if (usingEphemeralEthereal) {
    console.log(
      '[TIP] Para probar con tu propia bandeja (Ethereal fija o Gmail), configura SMTP_USER, SMTP_PASS y SMTP_TEST_TO en tu archivo .env y vuelve a ejecutar: npm run mail:test',
    );
  }
  console.log(`\n[OK] Todas las comprobaciones finalizaron correctamente (destino: ${destinatario}).\n`);
}

try {
  await ejecutarVerificacion();
} catch (error) {
  console.error('\n[ERROR] No se pudo completar la prueba SMTP:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

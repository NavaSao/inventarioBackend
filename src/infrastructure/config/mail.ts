import 'dotenv/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  welcomeEnabledByDefault: boolean;
  testRecipient?: string;
  isConfigured: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'si', 'sí'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return fallback;
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

/**
 * Carga y normaliza la configuración SMTP desde variables de entorno.
 * Compatible con Ethereal Email (pruebas), Gmail (App Password) y servidores SMTP estándar.
 * No lanza excepción al importar para no bloquear el arranque del servidor si SMTP aún no se configura.
 */
export function loadMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const host = env.SMTP_HOST?.trim() || '';
  const port = parsePort(env.SMTP_PORT, 587);
  const secure = parseBoolean(env.SMTP_SECURE, port === 465);
  const user = env.SMTP_USER?.trim() || '';
  const pass = env.SMTP_PASS?.trim() || '';
  const from =
    env.SMTP_FROM?.trim() ||
    (user ? `AssetOps Notificaciones <${user}>` : 'AssetOps Notificaciones <no-reply@assetops.local>');
  const welcomeEnabledByDefault = parseBoolean(env.MAIL_WELCOME_ENABLED, true);
  const testRecipient = env.SMTP_TEST_TO?.trim() || undefined;

  const isConfigured = Boolean(host && user && pass);

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    welcomeEnabledByDefault,
    testRecipient,
    isConfigured,
  };
}

export const mailConfig = loadMailConfig();

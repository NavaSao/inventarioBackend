import 'dotenv/config';

const secret = process.env.JWT_SECRET?.trim();
if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 bytes en el archivo .env.');
}

export const jwtConfig = {
  secret,
  expiresIn: '1h' as const,
  algorithm: 'HS256' as const,
};

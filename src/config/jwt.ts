export const configuracionJwt = { algoritmo: 'HS256', expiracion: '1h' } as const;

export function validarSecretoJwt(secreto: string): string {
  const valor = secreto.trim();
  if (Buffer.byteLength(valor, 'utf8') < 32) {
    throw new Error('Configura JWT_SECRET con al menos 32 bytes en .env.');
  }
  return valor;
}

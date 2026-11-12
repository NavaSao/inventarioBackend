import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BcryptPasswordHasher } from './bcryptPasswordHasher.js';
import { JwtTokenService } from './jwtTokenService.js';

describe('BcryptPasswordHasher', () => {
  it('hashea contraseñas y verifica correctamente', async () => {
    const hasher = new BcryptPasswordHasher(10);
    const password = 'PasswordDePrueba123';

    const hash = await hasher.hash(password);
    assert.ok(hash.startsWith('$2'));

    const esValida = await hasher.compare(password, hash);
    assert.equal(esValida, true);

    const esInvalida = await hasher.compare('PasswordEquivocada', hash);
    assert.equal(esInvalida, false);
  });
});

describe('JwtTokenService', () => {
  const secretoValido = '1234567890123456789012345678901234567890';

  it('rechaza secretos menores a 32 bytes', () => {
    assert.throws(
      () => new JwtTokenService({ secreto: 'corto' }),
      /Configura JWT_SECRET con al menos 32 bytes en \.env\./
    );
  });

  it('firma y verifica tokens exitosamente', () => {
    const service = new JwtTokenService({ secreto: secretoValido });
    const idUsuario = 'user-abc-123';
    const versionSesion = 4;

    const token = service.firmarToken(idUsuario, versionSesion);
    assert.ok(typeof token === 'string' && token.length > 20);

    const payload = service.verificarToken(token);
    assert.ok(payload);
    assert.equal(payload.sub, idUsuario);
    assert.equal(payload.versionSesion, versionSesion);
  });

  it('retorna null ante tokens inválidos o manipulados', () => {
    const service = new JwtTokenService({ secreto: secretoValido });
    assert.equal(service.verificarToken('token-invalido'), null);
  });
});

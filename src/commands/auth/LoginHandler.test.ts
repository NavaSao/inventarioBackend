import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IniciarSesionCommand } from './LoginCommand.js';
import { IniciarSesionHandler } from './LoginHandler.js';
import type { IUsuarioLoginRepository, UsuarioAuthDto } from '../../contracts/usuarioRepository.interface.js';
import type { IPasswordHasher } from '../../contracts/passwordHasher.interface.js';
import type { ITokenService, TokenPayload } from '../../contracts/tokenService.interface.js';

class MockUsuarioLoginRepo implements IUsuarioLoginRepository {
  constructor(private readonly usuario: UsuarioAuthDto | null) {}

  async buscarPorCorreo(correo: string): Promise<UsuarioAuthDto | null> {
    if (this.usuario && this.usuario.correo === correo) {
      return this.usuario;
    }
    return null;
  }

}

class MockPasswordHasher implements IPasswordHasher {
  constructor(private readonly coincide: boolean) {}

  async hash(password: string): Promise<string> {
    return `hash-${password}`;
  }

  async compare(_password: string, _hash: string | null): Promise<boolean> {
    return this.coincide;
  }
}

class MockTokenService implements ITokenService {
  firmarToken(idUsuario: string, versionSesion: number): string {
    return `jwt-${idUsuario}-${versionSesion}`;
  }

  verificarToken(_token: string): TokenPayload | null {
    return null;
  }
}

describe('IniciarSesionHandler', () => {
  const usuarioActivo: UsuarioAuthDto = {
    idUsuario: 'uuid-1',
    nombre: 'Admin TI',
    correo: 'admin@assetops.test',
    passwordHash: 'hash-valido',
    activo: true,
    versionSesion: 3,
  };

  it('inicia sesión exitosamente cuando las credenciales son correctas y la cuenta está activa', async () => {
    const handler = new IniciarSesionHandler(
      new MockUsuarioLoginRepo(usuarioActivo),
      new MockPasswordHasher(true),
      new MockTokenService()
    );

    const resultado = await handler.ejecutar(
      new IniciarSesionCommand('admin@assetops.test', 'PasswordCorrecta123')
    );

    assert.ok(resultado);
    assert.equal(resultado.token, 'jwt-uuid-1-3');
  });

  it('retorna null cuando el correo no existe en el sistema', async () => {
    const handler = new IniciarSesionHandler(
      new MockUsuarioLoginRepo(null),
      new MockPasswordHasher(false),
      new MockTokenService()
    );

    const resultado = await handler.ejecutar(
      new IniciarSesionCommand('inexistente@assetops.test', 'PasswordCorrecta123')
    );

    assert.equal(resultado, null);
  });

  it('retorna null cuando la contraseña es incorrecta', async () => {
    const handler = new IniciarSesionHandler(
      new MockUsuarioLoginRepo(usuarioActivo),
      new MockPasswordHasher(false),
      new MockTokenService()
    );

    const resultado = await handler.ejecutar(
      new IniciarSesionCommand('admin@assetops.test', 'PasswordIncorrecta')
    );

    assert.equal(resultado, null);
  });

  it('retorna null cuando la cuenta de usuario está inactiva', async () => {
    const usuarioInactivo: UsuarioAuthDto = {
      ...usuarioActivo,
      activo: false,
    };

    const handler = new IniciarSesionHandler(
      new MockUsuarioLoginRepo(usuarioInactivo),
      new MockPasswordHasher(true),
      new MockTokenService()
    );

    const resultado = await handler.ejecutar(
      new IniciarSesionCommand('admin@assetops.test', 'PasswordCorrecta123')
    );

    assert.equal(resultado, null);
  });
});

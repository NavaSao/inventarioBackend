import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { crearApp } from '../app.js';
import { crearAuthController } from './AuthController.js';
import { crearMiddlewareAuth } from '../middlewares/auth.js';
import { crearRutasAuth } from '../routes/authRoutes.js';
import { InMemoryCommandBus } from '../core/cqrs/commandBus.js';
import { InMemoryQueryBus } from '../core/cqrs/queryBus.js';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from '../commands/auth/LoginCommand.js';
import { ObtenerSesionQuery } from '../queries/auth/GetSessionQuery.js';
import type { ICommandHandler } from '../core/cqrs/command.interface.js';
import type { IQueryHandler } from '../core/cqrs/query.interface.js';
import type { ITokenService, TokenPayload } from '../contracts/tokenService.interface.js';
import type { DatosSesion } from '../queries/auth/sesion.dto.js';

describe('Rutas de autenticación', () => {
  const dummyToken = 'mocked.jwt.token';

  class MockLoginCommandHandler implements ICommandHandler<IniciarSesionCommand, ResultadoIniciarSesion | null> {
    readonly tipoComando = IniciarSesionCommand.tipo;
    async ejecutar(comando: IniciarSesionCommand) {
      if (comando.correo === 'admin@assetops.test' && comando.password === 'PasswordCorrecta123') {
        return { token: dummyToken };
      }
      return null;
    }
  }

  class MockSesionQueryHandler implements IQueryHandler<ObtenerSesionQuery, DatosSesion | null> {
    readonly tipoQuery = ObtenerSesionQuery.tipo;
    async ejecutar(consulta: ObtenerSesionQuery) {
      if (consulta.idUsuario === 'usr-1' && consulta.versionSesion === 1) {
        return { idUsuario: 'usr-1', nombre: 'Admin', correo: 'admin@assetops.test' };
      }
      return null;
    }
  }

  class MockTokenService implements ITokenService {
    firmarToken(): string {
      return dummyToken;
    }
    verificarToken(token: string): TokenPayload | null {
      if (token === dummyToken) {
        return { sub: 'usr-1', versionSesion: 1 };
      }
      if (token === 'token-revocado') {
        return { sub: 'usr-1', versionSesion: 0 }; // version mismatch
      }
      return null;
    }
  }

  let server: Server;
  let baseUrl: string;

  before(async () => {
    const commandBus = new InMemoryCommandBus();
    const queryBus = new InMemoryQueryBus();
    commandBus.registrar(new MockLoginCommandHandler());
    queryBus.registrar(new MockSesionQueryHandler());
    const auth = crearMiddlewareAuth(new MockTokenService());
    const app = crearApp(crearRutasAuth(crearAuthController(commandBus, queryBus), auth));
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  });

  function enviarLogin(body: string): Promise<Response> {
    return fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  it('confirma que Express está disponible', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 200, message: 'API disponible', data: null });
  });

  it('retorna 400 si los datos del cuerpo no son válidos', async () => {
    const res = await enviarLogin(JSON.stringify({ correo: 'invalido' }));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), {
      status: 400, message: 'Revisa el correo y la contraseña', data: null,
    });
  });

  it('devuelve el mismo formato para JSON mal formado', async () => {
    const res = await enviarLogin('{');
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), {
      status: 400, message: 'Revisa los datos de la solicitud', data: null,
    });
  });

  it('retorna 401 si las credenciales son incorrectas', async () => {
    const res = await enviarLogin(JSON.stringify({
      correo: 'admin@assetops.test', password: 'PasswordErronea123',
    }));
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { status: 401, message: 'Acceso inválido', data: null });
  });

  it('normaliza el correo y retorna 200 con el token y Cache-Control: no-store', async () => {
    const res = await enviarLogin(JSON.stringify({
      correo: '  ADMIN@assetops.test  ', password: 'PasswordCorrecta123',
    }));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await res.json(), {
      status: 200, message: 'Inicio de sesión correcto', data: { token: dummyToken },
    });
  });

  it('retorna 401 si falta la cabecera Authorization', async () => {
    const res = await fetch(`${baseUrl}/api/auth/sesion`);
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { status: 401, message: 'Acceso no autorizado', data: null });
  });

  it('retorna 401 si el token no es válido o está expirado', async () => {
    const res = await fetch(`${baseUrl}/api/auth/sesion`, {
      headers: { Authorization: 'Bearer token-invalido' },
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), {
      status: 401, message: 'Sesión inválida o expirada', data: null,
    });
  });

  it('retorna 401 si la sesión fue revocada o la cuenta no coincide', async () => {
    const res = await fetch(`${baseUrl}/api/auth/sesion`, {
      headers: { Authorization: 'Bearer token-revocado' },
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), {
      status: 401, message: 'Sesión revocada o cuenta inactiva', data: null,
    });
  });

  it('devuelve los datos públicos en las dos rutas de sesión', async () => {
    for (const ruta of ['sesion', 'session']) {
      const res = await fetch(`${baseUrl}/api/auth/${ruta}`, {
        headers: { Authorization: `Bearer ${dummyToken}` },
      });
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), {
        status: 200, message: 'Sesión activa',
        data: { idUsuario: 'usr-1', nombre: 'Admin', correo: 'admin@assetops.test' },
      });
    }
  });
});

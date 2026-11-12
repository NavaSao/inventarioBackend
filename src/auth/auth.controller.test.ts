import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthController } from './auth.controller.js';
import { InMemoryCommandBus } from '../core/cqrs/commandBus.js';
import { InMemoryQueryBus } from '../core/cqrs/queryBus.js';
import { IniciarSesionCommand, type ResultadoIniciarSesion } from '../commands/auth/iniciarSesion.command.js';
import { ObtenerSesionQuery } from '../queries/auth/obtenerSesion.query.js';
import type { ICommandHandler } from '../core/cqrs/command.interface.js';
import type { IQueryHandler } from '../core/cqrs/query.interface.js';
import type { ITokenService, TokenPayload } from '../core/interfaces/tokenService.interface.js';
import type { DatosSesion } from '../queries/auth/sesion.dto.js';
import type { Request, Response } from 'express';

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    set(key: string, value: string) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res as Response & { statusCode: number; headers: Record<string, string>; body: any };
}

describe('AuthController', () => {
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

  function setupController() {
    const commandBus = new InMemoryCommandBus();
    const queryBus = new InMemoryQueryBus();
    commandBus.registrar(new MockLoginCommandHandler());
    queryBus.registrar(new MockSesionQueryHandler());
    const tokenService = new MockTokenService();

    const controller = new AuthController(commandBus, queryBus, tokenService);
    return { controller };
  }

  describe('login', () => {
    it('retorna 400 si los datos del cuerpo no son válidos', async () => {
      const { controller } = setupController();
      const req = { body: { correo: 'invalido' } } as Request;
      const res = createMockResponse();

      await controller.login(req, res);

      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body, { mensaje: 'Revisa el correo y la contraseña' });
    });

    it('retorna 401 si las credenciales son incorrectas', async () => {
      const { controller } = setupController();
      const req = {
        body: { correo: 'admin@assetops.test', password: 'PasswordErronea123' },
      } as Request;
      const res = createMockResponse();

      await controller.login(req, res);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { mensaje: 'Acceso inválido' });
    });

    it('retorna 200 con el token y cabecera Cache-Control: no-store', async () => {
      const { controller } = setupController();
      const req = {
        body: { correo: 'admin@assetops.test', password: 'PasswordCorrecta123' },
      } as Request;
      const res = createMockResponse();

      await controller.login(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['cache-control'], 'no-store');
      assert.deepEqual(res.body, { token: dummyToken });
    });
  });

  describe('consultarSesion', () => {
    it('retorna 401 si falta la cabecera Authorization', async () => {
      const { controller } = setupController();
      const req = { headers: {} } as Request;
      const res = createMockResponse();

      await controller.consultarSesion(req, res);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { mensaje: 'Acceso no autorizado' });
    });

    it('retorna 401 si el token no es válido o está expirado', async () => {
      const { controller } = setupController();
      const req = { headers: { authorization: 'Bearer token-invalido' } } as Request;
      const res = createMockResponse();

      await controller.consultarSesion(req, res);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { mensaje: 'Sesión inválida o expirada' });
    });

    it('retorna 401 si la sesión fue revocada o la cuenta no coincide', async () => {
      const { controller } = setupController();
      const req = { headers: { authorization: 'Bearer token-revocado' } } as Request;
      const res = createMockResponse();

      await controller.consultarSesion(req, res);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { mensaje: 'Sesión revocada o cuenta inactiva' });
    });

    it('retorna 200 con la información del usuario autenticado', async () => {
      const { controller } = setupController();
      const req = { headers: { authorization: `Bearer ${dummyToken}` } } as Request;
      const res = createMockResponse();

      await controller.consultarSesion(req, res);

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, {
        idUsuario: 'usr-1',
        nombre: 'Admin',
        correo: 'admin@assetops.test',
      });
    });
  });
});

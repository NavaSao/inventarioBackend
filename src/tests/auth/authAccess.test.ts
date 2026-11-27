import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LoginCommandHandler } from '../../application/auth/commands/login/LoginCommandHandler.js';
import { LoginCommand } from '../../application/auth/commands/login/LoginCommand.js';
import { GlobalLogoutCommandHandler } from '../../application/auth/commands/global-logout/GlobalLogoutCommandHandler.js';
import { GlobalLogoutCommand } from '../../application/auth/commands/global-logout/GlobalLogoutCommand.js';
import { ValidateSessionQueryHandler } from '../../application/auth/queries/validate-session/ValidateSessionQueryHandler.js';
import { ValidateSessionQuery } from '../../application/auth/queries/validate-session/ValidateSessionQuery.js';
import { LoginController } from '../../presentation/controllers/LoginController.js';
import { GlobalLogoutController } from '../../presentation/controllers/GlobalLogoutController.js';
import { ValidateSessionController } from '../../presentation/controllers/ValidateSessionController.js';
import { AuthGuard } from '../../presentation/middlewares/authGuard.js';
import { TokenService } from '../../infrastructure/services/TokenService.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import type {
  IUserAuthRepository,
  ISessionInvalidationRepository,
  ISessionQueryRepository,
  IAuthService,
  UserAuthEntity,
  UserSessionDTO,
} from '../../domain/contracts/index.js';
import type { Request, Response } from 'express';

// Repositorio en memoria que implementa las interfaces segregadas (SOLID ISP / DIP)
class InMemoryUserRepository implements IUserAuthRepository, ISessionInvalidationRepository, ISessionQueryRepository {
  public users: Map<string, UserAuthEntity> = new Map();

  async findByEmail(correo: string): Promise<UserAuthEntity | null> {
    for (const user of this.users.values()) {
      if (user.correo.toLowerCase() === correo.toLowerCase()) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(idUsuario: string): Promise<UserAuthEntity | null> {
    const user = this.users.get(idUsuario);
    return user ? { ...user } : null;
  }

  async incrementSessionVersion(idUsuario: string): Promise<void> {
    const user = this.users.get(idUsuario);
    if (user) {
      user.versionSesion += 1;
      this.users.set(idUsuario, user);
    }
  }

  async findSessionById(idUsuario: string, versionSesion: number): Promise<UserSessionDTO | null> {
    const user = this.users.get(idUsuario);
    if (!user || !user.activo || user.versionSesion !== versionSesion) {
      return null;
    }
    return {
      idUsuario: user.idUsuario,
      nombre: user.nombre,
      correo: user.correo,
    };
  }
}

// Mock de AuthService para validar contraseñas
class MockAuthService implements IAuthService {
  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hash_${password}`;
  }

  async getComparisonHash(): Promise<string> {
    return 'fake_comparison_hash';
  }
}

describe('PR #1: Backend de Acceso (HU01 y HU02) - CQRS + SOLID + Clean Architecture', () => {
  let userRepo: InMemoryUserRepository;
  let authService: MockAuthService;
  let tokenService: TokenService;
  let loginHandler: LoginCommandHandler;
  let globalLogoutHandler: GlobalLogoutCommandHandler;
  let validateSessionHandler: ValidateSessionQueryHandler;
  let authGuard: AuthGuard;

  const TEST_SECRET = 'super-secret-key-that-has-at-least-32-bytes-long!';

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    authService = new MockAuthService();
    tokenService = new TokenService(TEST_SECRET);

    loginHandler = new LoginCommandHandler(userRepo, authService, tokenService);
    globalLogoutHandler = new GlobalLogoutCommandHandler(userRepo);
    validateSessionHandler = new ValidateSessionQueryHandler(userRepo);
    authGuard = new AuthGuard(tokenService);

    // Usuario activo de prueba
    userRepo.users.set('usr-001', {
      idUsuario: 'usr-001',
      nombre: 'Administrador AssetOps',
      correo: 'admin@assetops.test',
      passwordHash: 'hash_Password123',
      activo: true,
      versionSesion: 0,
    });

    // Usuario inactivo de prueba
    userRepo.users.set('usr-002', {
      idUsuario: 'usr-002',
      nombre: 'Usuario Inactivo',
      correo: 'inactivo@assetops.test',
      passwordHash: 'hash_Password123',
      activo: false,
      versionSesion: 0,
    });
  });

  describe('1. Criterio: Acceso con JWT (HU01)', () => {
    it('debe autenticar al usuario y generar un JWT válido con idUsuario y versionSesion', async () => {
      const command = new LoginCommand('admin@assetops.test', 'Password123');
      const result = await loginHandler.handle(command);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user.correo).toBe('admin@assetops.test');

      // Validar payload del token emitido
      const payload = tokenService.verifyToken(result.token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('usr-001');
      expect(payload?.versionSesion).toBe(0);
    });

    it('debe permitir validar la sesión activa usando el token emitido', async () => {
      const loginResult = await loginHandler.handle(new LoginCommand('admin@assetops.test', 'Password123'));
      const payload = tokenService.verifyToken(loginResult.token)!;

      const query = new ValidateSessionQuery(payload.sub, payload.versionSesion);
      const session = await validateSessionHandler.handle(query);

      expect(session).toBeDefined();
      expect(session.idUsuario).toBe('usr-001');
      expect(session.nombre).toBe('Administrador AssetOps');
    });

    it('el AuthGuard debe autorizar peticiones con header Bearer válido', () => {
      const token = tokenService.generateToken('usr-001', 0);
      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as Request;
      const res = {} as Response;
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      authGuard.handle(req, res, next);

      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user?.idUsuario).toBe('usr-001');
      expect(req.user?.versionSesion).toBe(0);
    });
  });

  describe('2. Criterio: Rechazo de cuenta inactiva (HU01)', () => {
    it('debe rechazar el login si la cuenta está inactiva (activo: false)', async () => {
      const command = new LoginCommand('inactivo@assetops.test', 'Password123');

      await expect(loginHandler.handle(command)).rejects.toThrow(BusinessError);
      await expect(loginHandler.handle(command)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Credenciales inválidas o cuenta deshabilitada',
      });
    });

    it('debe rechazar la validación de sesión si el usuario fue desactivado posteriormente', async () => {
      // Token generado cuando estaba activo
      const token = tokenService.generateToken('usr-001', 0);
      const payload = tokenService.verifyToken(token)!;

      // Desactivar usuario en la base de datos
      const user = userRepo.users.get('usr-001')!;
      user.activo = false;
      userRepo.users.set('usr-001', user);

      const query = new ValidateSessionQuery(payload.sub, payload.versionSesion);
      await expect(validateSessionHandler.handle(query)).rejects.toThrow(BusinessError);
      await expect(validateSessionHandler.handle(query)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Sesión expirada, revocada o usuario inactivo',
      });
    });
  });

  describe('3. Criterio: Rechazo de tokens anteriores tras Cierre Global (HU02)', () => {
    it('debe invalidar todos los tokens previos al ejecutar el cierre de sesión global', async () => {
      // Paso 1: Usuario inicia sesión en laptop (emite Token A con versionSesion: 0)
      const tokenA = tokenService.generateToken('usr-001', 0);

      // Token A es válido inicialmente
      const queryA = new ValidateSessionQuery('usr-001', 0);
      const sessionA = await validateSessionHandler.handle(queryA);
      expect(sessionA.idUsuario).toBe('usr-001');

      // Paso 2: Usuario solicita cierre de sesión global (GlobalLogoutCommand)
      const logoutResult = await globalLogoutHandler.handle(new GlobalLogoutCommand('usr-001'));
      expect(logoutResult.success).toBe(true);

      // Verificamos que la versión en la base de datos se incrementó a 1
      const updatedUser = userRepo.users.get('usr-001')!;
      expect(updatedUser.versionSesion).toBe(1);

      // Paso 3: Intentar usar el Token A (versión 0) debe ser RECHAZADO
      await expect(validateSessionHandler.handle(queryA)).rejects.toThrow(BusinessError);
      await expect(validateSessionHandler.handle(queryA)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Sesión expirada, revocada o usuario inactivo',
      });

      // Paso 4: Si el usuario vuelve a iniciar sesión, recibe Token B con versionSesion: 1
      const loginResultB = await loginHandler.handle(new LoginCommand('admin@assetops.test', 'Password123'));
      const payloadB = tokenService.verifyToken(loginResultB.token)!;
      expect(payloadB.versionSesion).toBe(1);

      // Token B sí es aceptado
      const queryB = new ValidateSessionQuery(payloadB.sub, payloadB.versionSesion);
      const sessionB = await validateSessionHandler.handle(queryB);
      expect(sessionB.idUsuario).toBe('usr-001');
    });
  });

  describe('4. Single Action Controllers (SRP)', () => {
    it('LoginController debe invocar el handler y responder con HTTP 200', async () => {
      const controller = new LoginController(loginHandler);
      const req = {
        body: { correo: 'admin@assetops.test', password: 'Password123' },
      } as Request;
      const res = {
        set: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            token: expect.any(String),
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('GlobalLogoutController debe invocar el handler y responder con HTTP 200', async () => {
      const controller = new GlobalLogoutController(globalLogoutHandler);
      const req = {
        user: { idUsuario: 'usr-001', versionSesion: 0 },
      } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Cierre de sesión global realizado exitosamente',
        }),
      );
    });

    it('ValidateSessionController debe invocar el handler y responder con HTTP 200', async () => {
      const controller = new ValidateSessionController(validateSessionHandler);
      const req = {
        user: { idUsuario: 'usr-001', versionSesion: 0 },
      } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            idUsuario: 'usr-001',
          }),
        }),
      );
    });

    it('AuthGuard debe enviar error 401 a next si no se proporciona token', () => {
      const req = { headers: {} } as Request;
      const res = {} as Response;
      expect(() => authGuard.handle(req, res, jest.fn())).toThrow(BusinessError);
    });
  });
});

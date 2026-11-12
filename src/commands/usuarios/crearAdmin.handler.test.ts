import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CrearAdminCommand } from './crearAdmin.command.js';
import { CrearAdminHandler } from './crearAdmin.handler.js';
import type { CrearUsuarioInput, IUsuarioWriteRepository } from '../../core/interfaces/usuarioRepository.interface.js';
import type { IPasswordHasher } from '../../core/interfaces/passwordHasher.interface.js';

class MockUsuarioWriteRepo implements IUsuarioWriteRepository {
  public datosCreados: CrearUsuarioInput[] = [];

  constructor(private readonly exitoAlCrear: boolean = true) {}

  async crear(datos: CrearUsuarioInput): Promise<boolean> {
    this.datosCreados.push(datos);
    return this.exitoAlCrear;
  }
}

class MockAdminPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return `hash_seguro_${password}`;
  }

  async compare(): Promise<boolean> {
    return true;
  }
}

describe('CrearAdminHandler', () => {
  it('hashea la contraseña y delega la creación al repositorio de escritura', async () => {
    const writeRepo = new MockUsuarioWriteRepo(true);
    const hasher = new MockAdminPasswordHasher();
    const handler = new CrearAdminHandler(writeRepo, hasher);

    const resultado = await handler.ejecutar(
      new CrearAdminCommand('Super Admin', 'admin@assetops.test', 'PasswordSegura123')
    );

    assert.equal(resultado.creado, true);
    assert.equal(writeRepo.datosCreados.length, 1);
    assert.deepEqual(writeRepo.datosCreados[0], {
      nombre: 'Super Admin',
      correo: 'admin@assetops.test',
      passwordHash: 'hash_seguro_PasswordSegura123',
    });
  });

  it('reporta creado=false si el usuario ya existía en la base', async () => {
    const writeRepo = new MockUsuarioWriteRepo(false);
    const hasher = new MockAdminPasswordHasher();
    const handler = new CrearAdminHandler(writeRepo, hasher);

    const resultado = await handler.ejecutar(
      new CrearAdminCommand('Super Admin', 'admin@assetops.test', 'PasswordSegura123')
    );

    assert.equal(resultado.creado, false);
  });
});

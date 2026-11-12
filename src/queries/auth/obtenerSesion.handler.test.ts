import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObtenerSesionQuery } from './obtenerSesion.query.js';
import { ObtenerSesionHandler } from './obtenerSesion.handler.js';
import type { IUsuarioReadRepository, UsuarioSesionDto } from '../../core/interfaces/usuarioRepository.interface.js';

class MockUsuarioSesionReadRepo implements IUsuarioReadRepository {
  constructor(private readonly usuario: UsuarioSesionDto | null) {}

  async buscarPorId(idUsuario: string): Promise<UsuarioSesionDto | null> {
    if (this.usuario && this.usuario.idUsuario === idUsuario) {
      return this.usuario;
    }
    return null;
  }

  async buscarPorCorreo(): Promise<any> {
    return null;
  }
}

describe('ObtenerSesionHandler', () => {
  const sesionValida: UsuarioSesionDto = {
    idUsuario: 'usr-123',
    nombre: 'Hugo Admin',
    correo: 'admin@assetops.test',
    activo: true,
    versionSesion: 2,
  };

  it('obtiene la información de sesión cuando el usuario está activo y la versión coincide', async () => {
    const handler = new ObtenerSesionHandler(new MockUsuarioSesionReadRepo(sesionValida));

    const resultado = await handler.ejecutar(new ObtenerSesionQuery('usr-123', 2));

    assert.ok(resultado);
    assert.deepEqual(resultado, {
      idUsuario: 'usr-123',
      nombre: 'Hugo Admin',
      correo: 'admin@assetops.test',
    });
  });

  it('retorna null si el usuario no existe', async () => {
    const handler = new ObtenerSesionHandler(new MockUsuarioSesionReadRepo(null));

    const resultado = await handler.ejecutar(new ObtenerSesionQuery('no-existe', 2));

    assert.equal(resultado, null);
  });

  it('retorna null si el usuario está inactivo', async () => {
    const sesionInactiva: UsuarioSesionDto = {
      ...sesionValida,
      activo: false,
    };
    const handler = new ObtenerSesionHandler(new MockUsuarioSesionReadRepo(sesionInactiva));

    const resultado = await handler.ejecutar(new ObtenerSesionQuery('usr-123', 2));

    assert.equal(resultado, null);
  });

  it('retorna null si la versión de sesión no coincide (sesión revocada)', async () => {
    const handler = new ObtenerSesionHandler(new MockUsuarioSesionReadRepo(sesionValida));

    // Token con versionSesion 1 pero la base tiene 2
    const resultado = await handler.ejecutar(new ObtenerSesionQuery('usr-123', 1));

    assert.equal(resultado, null);
  });
});

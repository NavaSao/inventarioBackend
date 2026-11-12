import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryQueryBus } from './queryBus.js';
import type { IQuery, IQueryHandler } from './query.interface.js';

class DummyQuery implements IQuery {
  static readonly tipo = 'dummy.query';
  readonly tipo = DummyQuery.tipo;
  constructor(public readonly id: number) {}
}

class DummyQueryHandler implements IQueryHandler<DummyQuery, { id: number; nombre: string }> {
  readonly tipoQuery = DummyQuery.tipo;
  async ejecutar(consulta: DummyQuery) {
    return { id: consulta.id, nombre: `Elemento ${consulta.id}` };
  }
}

describe('InMemoryQueryBus', () => {
  it('registra y ejecuta una consulta correctamente', async () => {
    const bus = new InMemoryQueryBus();
    bus.registrar(new DummyQueryHandler());

    const resultado = await bus.consultar<{ id: number; nombre: string }>(new DummyQuery(42));
    assert.deepEqual(resultado, { id: 42, nombre: 'Elemento 42' });
  });

  it('lanza error al intentar registrar dos veces la misma consulta', () => {
    const bus = new InMemoryQueryBus();
    bus.registrar(new DummyQueryHandler());

    assert.throws(
      () => bus.registrar(new DummyQueryHandler()),
      /Ya existe un manejador registrado para la consulta: dummy\.query/
    );
  });

  it('lanza error al consultar sin manejador registrado', async () => {
    const bus = new InMemoryQueryBus();

    await assert.rejects(
      async () => bus.consultar(new DummyQuery(1)),
      /No existe un manejador registrado para la consulta: dummy\.query/
    );
  });
});

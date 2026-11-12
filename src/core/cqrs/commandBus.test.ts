import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCommandBus } from './commandBus.js';
import type { ICommand, ICommandHandler } from './command.interface.js';

class DummyCommand implements ICommand {
  static readonly tipo = 'dummy.command';
  readonly tipo = DummyCommand.tipo;
  constructor(public readonly valor: string) {}
}

class DummyHandler implements ICommandHandler<DummyCommand, string> {
  readonly tipoComando = DummyCommand.tipo;
  async ejecutar(comando: DummyCommand): Promise<string> {
    return `procesado: ${comando.valor}`;
  }
}

describe('InMemoryCommandBus', () => {
  it('registra y ejecuta un comando correctamente', async () => {
    const bus = new InMemoryCommandBus();
    bus.registrar(new DummyHandler());

    const resultado = await bus.ejecutar<string>(new DummyCommand('prueba'));
    assert.equal(resultado, 'procesado: prueba');
  });

  it('lanza error al intentar registrar dos veces el mismo comando', () => {
    const bus = new InMemoryCommandBus();
    bus.registrar(new DummyHandler());

    assert.throws(
      () => bus.registrar(new DummyHandler()),
      /Ya existe un manejador registrado para el comando: dummy\.command/
    );
  });

  it('lanza error al ejecutar un comando sin manejador registrado', async () => {
    const bus = new InMemoryCommandBus();

    await assert.rejects(
      async () => bus.ejecutar(new DummyCommand('hola')),
      /No existe un manejador registrado para el comando: dummy\.command/
    );
  });
});

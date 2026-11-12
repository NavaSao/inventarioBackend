import type { ICommand, ICommandBus, ICommandHandler } from './command.interface.js';

export class InMemoryCommandBus implements ICommandBus {
  private readonly manejadores = new Map<string, ICommandHandler<any, any>>();

  registrar<TCommand extends ICommand, TResult>(manejador: ICommandHandler<TCommand, TResult>): void {
    if (this.manejadores.has(manejador.tipoComando)) {
      throw new Error(`Ya existe un manejador registrado para el comando: ${manejador.tipoComando}`);
    }
    this.manejadores.set(manejador.tipoComando, manejador);
  }

  async ejecutar<TResult = unknown>(comando: ICommand): Promise<TResult> {
    const manejador = this.manejadores.get(comando.tipo);
    if (!manejador) {
      throw new Error(`No existe un manejador registrado para el comando: ${comando.tipo}`);
    }
    return manejador.ejecutar(comando) as Promise<TResult>;
  }
}

import type { IQuery, IQueryBus, IQueryHandler } from './query.interface.js';

export class InMemoryQueryBus implements IQueryBus {
  private readonly manejadores = new Map<string, IQueryHandler<any, any>>();

  registrar<TQuery extends IQuery, TResult>(manejador: IQueryHandler<TQuery, TResult>): void {
    if (this.manejadores.has(manejador.tipoQuery)) {
      throw new Error(`Ya existe un manejador registrado para la consulta: ${manejador.tipoQuery}`);
    }
    this.manejadores.set(manejador.tipoQuery, manejador);
  }

  async consultar<TResult = unknown>(consulta: IQuery): Promise<TResult> {
    const manejador = this.manejadores.get(consulta.tipo);
    if (!manejador) {
      throw new Error(`No existe un manejador registrado para la consulta: ${consulta.tipo}`);
    }
    return manejador.ejecutar(consulta) as Promise<TResult>;
  }
}

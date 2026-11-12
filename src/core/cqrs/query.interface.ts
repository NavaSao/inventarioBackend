export interface IQuery {
  readonly tipo: string;
}

export interface IQueryHandler<TQuery extends IQuery = IQuery, TResult = unknown> {
  readonly tipoQuery: string;
  ejecutar(consulta: TQuery): Promise<TResult>;
}

export interface IQueryBus {
  registrar<TQuery extends IQuery, TResult>(manejador: IQueryHandler<TQuery, TResult>): void;
  consultar<TResult = unknown>(consulta: IQuery): Promise<TResult>;
}

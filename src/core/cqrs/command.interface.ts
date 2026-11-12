export interface ICommand {
  readonly tipo: string;
}

export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = unknown> {
  readonly tipoComando: string;
  ejecutar(comando: TCommand): Promise<TResult>;
}

export interface ICommandBus {
  registrar<TCommand extends ICommand, TResult>(manejador: ICommandHandler<TCommand, TResult>): void;
  ejecutar<TResult = unknown>(comando: ICommand): Promise<TResult>;
}

import { IniciarSesionCommand, type ResultadoIniciarSesion } from './iniciarSesion.command.js';
import { IniciarSesionHandler } from './iniciarSesion.handler.js';
import { obtenerContenedor } from '../../container.js';

export { IniciarSesionCommand, IniciarSesionHandler, type ResultadoIniciarSesion };

/**
 * Función facade para compatibilidad directa que despacha el comando a través del CommandBus.
 */
export async function iniciarSesion(correo: string, password: string): Promise<string | null> {
  const { commandBus } = obtenerContenedor();
  const resultado = await commandBus.ejecutar<ResultadoIniciarSesion | null>(
    new IniciarSesionCommand(correo, password)
  );
  return resultado?.token ?? null;
}

import type { FiltroActivos, IActivoReadModel } from '../../../domain/contracts/activos.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import type { ActivoDetalle } from '../../../domain/models/Activo.js';

export class ListarActivosHandler {
  constructor(private readonly lectura: IActivoReadModel) {}

  handle(filtro: FiltroActivos) {
    return this.lectura.listar(filtro);
  }
}

/** Ficha del activo por id o por la etiqueta UUID escaneada con la cámara. */
export class ConsultarActivoHandler {
  constructor(private readonly lectura: IActivoReadModel) {}

  async handle(criterio: { idActivo: string } | { etiqueta: string }): Promise<ActivoDetalle> {
    const activo = await this.lectura.consultar(criterio);
    if (!activo) {
      throw new BusinessError('Activo no encontrado', 404);
    }
    return activo;
  }
}

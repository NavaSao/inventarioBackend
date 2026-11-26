import type { IActivoRepository, IFotoStorage } from '../../../domain/contracts/activos.js';
import type { ConsultarActivoHandler } from '../../queries/activos/ActivoHandlers.js';
import type { DatosActivo } from '../../../domain/models/Activo.js';

export class RegistrarActivoHandler {
  constructor(private readonly repositorio: IActivoRepository) {}

  handle(command: DatosActivo) {
    return this.repositorio.registrar(command);
  }
}

export class EditarActivoHandler {
  constructor(
    private readonly repositorio: IActivoRepository,
    private readonly consulta: Pick<ConsultarActivoHandler, 'handle'>,
  ) {}

  async handle({ idActivo, ...datos }: DatosActivo & { idActivo: string }) {
    await this.consulta.handle({ idActivo });
    return this.repositorio.editar(idActivo, datos);
  }
}

/** Guarda la fotografía tomada con la cámara y la vincula al activo. */
export class SubirFotoActivoHandler {
  constructor(
    private readonly repositorio: IActivoRepository,
    private readonly fotos: IFotoStorage,
    private readonly consulta: Pick<ConsultarActivoHandler, 'handle'>,
  ) {}

  async handle({ idActivo, foto }: { idActivo: string; foto: Buffer }) {
    await this.consulta.handle({ idActivo });
    const ruta = await this.fotos.guardar(`${idActivo}.jpg`, foto);
    await this.repositorio.actualizarFoto(idActivo, `${ruta}?v=${Date.now()}`);
    return this.consulta.handle({ idActivo });
  }
}

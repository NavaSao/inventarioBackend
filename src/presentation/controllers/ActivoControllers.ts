import type { Request, Response } from 'express';
import type {
  EditarActivoHandler,
  RegistrarActivoHandler,
  SubirFotoActivoHandler,
} from '../../application/commands/activos/ActivoCatalogoHandlers.js';
import type {
  AsignarActivoHandler,
  CerrarMantenimientoHandler,
  DevolverActivoHandler,
  IniciarMantenimientoHandler,
} from '../../application/commands/activos/MovimientoActivoHandlers.js';
import type { ConsultarActivoHandler, ListarActivosHandler } from '../../application/queries/activos/ActivoHandlers.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';
import {
  asignarActivoSchema,
  datosActivoSchema,
  filtrosActivoSchema,
  fotoSchema,
  notaMantenimientoSchema,
  notaOpcionalSchema,
  parametrosActivoSchema,
  parametrosEtiquetaSchema,
  validarActivo,
} from '../validators/activoValidator.js';

// Express 5 envía al errorHandler los rechazos de handlers async, por eso no hay try/catch.

const idActivo = (req: Request) => validarActivo(parametrosActivoSchema, req.params).idActivo;
const idUsuario = (req: Request) => req.user!.idUsuario;

export class ListarActivosController {
  constructor(private readonly casoDeUso: Pick<ListarActivosHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const activos = await this.casoDeUso.handle(validarActivo(filtrosActivoSchema, req.query));
    ResponseBuilder.success(res, activos, 'Activos consultados');
  };
}

export class ConsultarActivoController {
  constructor(private readonly casoDeUso: Pick<ConsultarActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    ResponseBuilder.success(res, await this.casoDeUso.handle({ idActivo: idActivo(req) }), 'Activo consultado');
  };
}

/** Resultado del escaneo: busca el activo por la etiqueta UUID leída con la cámara. */
export class EscanearActivoController {
  constructor(private readonly casoDeUso: Pick<ConsultarActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const criterio = validarActivo(parametrosEtiquetaSchema, req.params);
    ResponseBuilder.success(res, await this.casoDeUso.handle(criterio), 'Activo encontrado');
  };
}

export class RegistrarActivoController {
  constructor(private readonly casoDeUso: Pick<RegistrarActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const activo = await this.casoDeUso.handle(validarActivo(datosActivoSchema, req.body));
    ResponseBuilder.success(res, activo, 'Activo registrado', 201);
  };
}

export class EditarActivoController {
  constructor(private readonly casoDeUso: Pick<EditarActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const datos = validarActivo(datosActivoSchema, req.body);
    ResponseBuilder.success(res, await this.casoDeUso.handle({ idActivo: idActivo(req), ...datos }), 'Activo actualizado');
  };
}

export class SubirFotoActivoController {
  constructor(private readonly casoDeUso: Pick<SubirFotoActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const foto = validarActivo(fotoSchema, req.body);
    ResponseBuilder.success(res, await this.casoDeUso.handle({ idActivo: idActivo(req), foto }), 'Foto guardada');
  };
}

export class AsignarActivoController {
  constructor(private readonly casoDeUso: Pick<AsignarActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const datos = validarActivo(asignarActivoSchema, req.body);
    const activo = await this.casoDeUso.handle({ idActivo: idActivo(req), idUsuario: idUsuario(req), ...datos });
    ResponseBuilder.success(res, activo, 'Activo asignado');
  };
}

export class DevolverActivoController {
  constructor(private readonly casoDeUso: Pick<DevolverActivoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const { nota } = validarActivo(notaOpcionalSchema, req.body);
    const activo = await this.casoDeUso.handle({ idActivo: idActivo(req), idUsuario: idUsuario(req), nota });
    ResponseBuilder.success(res, activo, 'Devolución registrada');
  };
}

export class IniciarMantenimientoController {
  constructor(private readonly casoDeUso: Pick<IniciarMantenimientoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const { nota } = validarActivo(notaMantenimientoSchema, req.body);
    const activo = await this.casoDeUso.handle({ idActivo: idActivo(req), idUsuario: idUsuario(req), nota });
    ResponseBuilder.success(res, activo, 'Activo enviado a mantenimiento');
  };
}

export class CerrarMantenimientoController {
  constructor(private readonly casoDeUso: Pick<CerrarMantenimientoHandler, 'handle'>) {}

  execute = async (req: Request, res: Response) => {
    const { nota } = validarActivo(notaOpcionalSchema, req.body);
    const activo = await this.casoDeUso.handle({ idActivo: idActivo(req), idUsuario: idUsuario(req), nota });
    ResponseBuilder.success(res, activo, 'Mantenimiento cerrado; el activo está disponible');
  };
}

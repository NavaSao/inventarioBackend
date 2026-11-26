import type { IMovimientosActivoRepository, MovimientoActivo } from '../../../domain/contracts/activos.js';
import type { IEmpleadoRepository } from '../../../domain/contracts/empleados.js';
import { BusinessError } from '../../../domain/exceptions/BusinessError.js';
import { validarTransicion, type AccionActivo, type ActivoDetalle } from '../../../domain/models/Activo.js';
import type { ConsultarActivoHandler } from '../../queries/activos/ActivoHandlers.js';

type Consulta = Pick<ConsultarActivoHandler, 'handle'>;

/** Valida la transición con la regla de dominio, la persiste y devuelve la ficha actualizada. */
async function ejecutarMovimiento(
  consulta: Consulta,
  idActivo: string,
  accion: AccionActivo,
  persistir: () => Promise<void>,
): Promise<ActivoDetalle> {
  const activo = await consulta.handle({ idActivo });
  validarTransicion(activo.estado, accion);
  await persistir();
  return consulta.handle({ idActivo });
}

export class AsignarActivoHandler {
  constructor(
    private readonly movimientos: IMovimientosActivoRepository,
    private readonly empleados: Pick<IEmpleadoRepository, 'buscarPorId'>,
    private readonly consulta: Consulta,
  ) {}

  async handle(command: MovimientoActivo & { idEmpleado: string }) {
    const empleado = await this.empleados.buscarPorId(command.idEmpleado);
    if (!empleado?.activo) {
      throw new BusinessError('El empleado no existe o está inactivo', 409);
    }
    return ejecutarMovimiento(this.consulta, command.idActivo, 'ASIGNAR', () => this.movimientos.asignar(command));
  }
}

export class DevolverActivoHandler {
  constructor(private readonly movimientos: IMovimientosActivoRepository, private readonly consulta: Consulta) {}

  handle(command: MovimientoActivo) {
    return ejecutarMovimiento(this.consulta, command.idActivo, 'DEVOLVER', () => this.movimientos.devolver(command));
  }
}

export class IniciarMantenimientoHandler {
  constructor(private readonly movimientos: IMovimientosActivoRepository, private readonly consulta: Consulta) {}

  handle(command: MovimientoActivo & { nota: string }) {
    return ejecutarMovimiento(
      this.consulta, command.idActivo, 'INICIAR_MANTENIMIENTO', () => this.movimientos.iniciarMantenimiento(command),
    );
  }
}

export class CerrarMantenimientoHandler {
  constructor(private readonly movimientos: IMovimientosActivoRepository, private readonly consulta: Consulta) {}

  handle(command: MovimientoActivo) {
    return ejecutarMovimiento(
      this.consulta, command.idActivo, 'CERRAR_MANTENIMIENTO', () => this.movimientos.cerrarMantenimiento(command),
    );
  }
}

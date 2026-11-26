import { describe, it, expect, beforeEach } from '@jest/globals';
import type { IMovimientosActivoRepository, IActivoReadModel, MovimientoActivo } from '../../domain/contracts/activos.js';
import { EstadoActivo } from '../../domain/enums/EstadoActivo.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';
import { TRANSICIONES, type ActivoDetalle } from '../../domain/models/Activo.js';
import type { Empleado } from '../../domain/models/Empleado.js';
import { ConsultarActivoHandler } from '../../application/queries/activos/ActivoHandlers.js';
import {
  AsignarActivoHandler,
  CerrarMantenimientoHandler,
  DevolverActivoHandler,
  IniciarMantenimientoHandler,
} from '../../application/commands/activos/MovimientoActivoHandlers.js';
import {
  datosActivoSchema,
  fotoSchema,
  notaMantenimientoSchema,
  validarActivo,
} from '../../presentation/validators/activoValidator.js';

const ID_ACTIVO = '7d3f5c0a-1b2c-4d5e-8f90-123456789abc';
const ID_EMPLEADO = '5b1e2a3c-4d5e-4f60-8a7b-9c0d1e2f3a4b';

/** Fake en memoria que aplica la misma máquina de estados que el repositorio Prisma. */
class InMemoryActivos implements IActivoReadModel, IMovimientosActivoRepository {
  activo: ActivoDetalle = {
    idActivo: ID_ACTIVO,
    nombre: 'Laptop Dell Latitude',
    numeroSerie: 'SN-001',
    etiqueta: '0f0e0d0c-0b0a-4908-8706-050403020100',
    categoria: 'Laptop',
    ubicacion: 'Piso 2',
    marca: null,
    modelo: null,
    estado: EstadoActivo.DISPONIBLE,
    fotoReferencia: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    asignacionActual: null,
    mantenimientoActual: null,
  };

  async listar() { return [this.activo]; }
  async consultar(criterio: { idActivo: string } | { etiqueta: string }) {
    const coincide = 'idActivo' in criterio
      ? criterio.idActivo === this.activo.idActivo
      : criterio.etiqueta === this.activo.etiqueta;
    return coincide ? { ...this.activo } : null;
  }

  async asignar(m: MovimientoActivo & { idEmpleado: string }) {
    this.activo.estado = TRANSICIONES.ASIGNAR.hacia;
    this.activo.asignacionActual = {
      entregadoEn: new Date(),
      empleado: { idEmpleado: m.idEmpleado, numeroEmpleado: 'EMP-1', nombre: 'Laura', departamento: null },
    };
  }
  async devolver() { this.activo.estado = TRANSICIONES.DEVOLVER.hacia; this.activo.asignacionActual = null; }
  async iniciarMantenimiento(m: MovimientoActivo & { nota: string }) {
    this.activo.estado = TRANSICIONES.INICIAR_MANTENIMIENTO.hacia;
    this.activo.mantenimientoActual = { iniciadoEn: new Date(), notaInicial: m.nota };
  }
  async cerrarMantenimiento() {
    this.activo.estado = TRANSICIONES.CERRAR_MANTENIMIENTO.hacia;
    this.activo.mantenimientoActual = null;
  }
}

const empleado = (activo: boolean) => ({ buscarPorId: async () => ({ idEmpleado: ID_EMPLEADO, activo }) as Empleado });
const base = { idActivo: ID_ACTIVO, idUsuario: 'admin', nota: null };

describe('Activos: ciclo de asignación, devolución y mantenimiento', () => {
  let repo: InMemoryActivos;
  let consulta: ConsultarActivoHandler;

  beforeEach(() => {
    repo = new InMemoryActivos();
    consulta = new ConsultarActivoHandler(repo);
  });

  it('el escaneo encuentra el activo por su etiqueta UUID y responde 404 si no existe', async () => {
    await expect(consulta.handle({ etiqueta: repo.activo.etiqueta })).resolves.toMatchObject({ idActivo: ID_ACTIVO });
    await expect(consulta.handle({ etiqueta: 'otra' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('asigna un activo disponible y la devolución restaura su disponibilidad', async () => {
    const asignado = await new AsignarActivoHandler(repo, empleado(true), consulta).handle({ ...base, idEmpleado: ID_EMPLEADO });
    expect(asignado.estado).toBe(EstadoActivo.ASIGNADO);
    expect(asignado.asignacionActual?.empleado.idEmpleado).toBe(ID_EMPLEADO);

    const devuelto = await new DevolverActivoHandler(repo, consulta).handle(base);
    expect(devuelto.estado).toBe(EstadoActivo.DISPONIBLE);
    expect(devuelto.asignacionActual).toBeNull();
  });

  it('rechaza asignar a un empleado inactivo', async () => {
    await expect(
      new AsignarActivoHandler(repo, empleado(false), consulta).handle({ ...base, idEmpleado: ID_EMPLEADO }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('bloquea la asignación mientras el activo está en mantenimiento y lo libera al cerrarlo', async () => {
    await new IniciarMantenimientoHandler(repo, consulta).handle({ ...base, nota: 'Pantalla dañada' });
    expect(repo.activo.estado).toBe(EstadoActivo.EN_MANTENIMIENTO);

    await expect(
      new AsignarActivoHandler(repo, empleado(true), consulta).handle({ ...base, idEmpleado: ID_EMPLEADO }),
    ).rejects.toThrow('El activo está en mantenimiento y no puede asignarse');

    const cerrado = await new CerrarMantenimientoHandler(repo, consulta).handle(base);
    expect(cerrado.estado).toBe(EstadoActivo.DISPONIBLE);
  });

  it('no envía a mantenimiento un activo asignado ni devuelve uno disponible', async () => {
    await expect(new DevolverActivoHandler(repo, consulta).handle(base)).rejects.toMatchObject({ statusCode: 409 });
    await new AsignarActivoHandler(repo, empleado(true), consulta).handle({ ...base, idEmpleado: ID_EMPLEADO });
    await expect(
      new IniciarMantenimientoHandler(repo, consulta).handle({ ...base, nota: 'Revisión' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('Activos: validación de entrada', () => {
  it('exige la nota de mantenimiento', () => {
    expect(() => validarActivo(notaMantenimientoSchema, { nota: '   ' })).toThrow('La nota de mantenimiento es obligatoria');
  });

  it('exige que la etiqueta sea un UUID y normaliza el número de serie', () => {
    const datos = { nombre: 'Monitor', numeroSerie: 'abc-1', categoria: 'Monitor', ubicacion: 'Almacén' };
    expect(() => validarActivo(datosActivoSchema, { ...datos, etiqueta: 'no-es-uuid' })).toThrow(ValidationError);
    expect(validarActivo(datosActivoSchema, { ...datos, etiqueta: ID_ACTIVO.toUpperCase() })).toMatchObject({
      numeroSerie: 'ABC-1',
      etiqueta: ID_ACTIVO,
      marca: null,
    });
  });

  it('acepta solo fotos JPEG', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64');
    expect(validarActivo(fotoSchema, jpeg)).toBeInstanceOf(Buffer);
    expect(() => validarActivo(fotoSchema, Buffer.from('hola').toString('base64'))).toThrow(ValidationError);
  });
});

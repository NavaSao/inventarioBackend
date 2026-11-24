import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type {
  AsignacionLicenciaDetalle,
  AssignLicenseInput,
  IAssignmentNotificationDispatcher,
  ILicenseAssignmentRepository,
  ILicenseUnitOfWork,
} from '../../domain/contracts/licenseAssignment.js';
import type { Empleado } from '../../domain/models/Empleado.js';
import type { Licencia } from '../../domain/models/Licencia.js';
import { AssignLicenseCommand } from '../../application/commands/licencias/AssignLicenseCommand.js';
import { AssignLicenseCommandHandler } from '../../application/commands/licencias/AssignLicenseCommandHandler.js';
import { ReleaseLicenseCommand } from '../../application/commands/licencias/ReleaseLicenseCommand.js';
import { ReleaseLicenseCommandHandler } from '../../application/commands/licencias/ReleaseLicenseCommandHandler.js';
import { EmailRetryPolicy } from '../../application/services/EmailRetryPolicy.js';
import { AssignLicenseController } from '../../presentation/controllers/AssignLicenseController.js';
import { ReleaseLicenseController } from '../../presentation/controllers/ReleaseLicenseController.js';

class InMemoryLicenseRepository implements ILicenseAssignmentRepository {
  public licencias: Map<string, Licencia> = new Map();
  public empleados: Map<string, Empleado> = new Map();
  public asignaciones: AsignacionLicenciaDetalle[] = [];

  async asignarCupo(
    input: AssignLicenseInput,
    claveAsignacion: string,
    fechaAsignacion: Date,
  ): Promise<AsignacionLicenciaDetalle> {
    const nueva: AsignacionLicenciaDetalle = {
      idAsignacionLicencia: randomUUID(),
      idLicencia: input.idLicencia,
      idEmpleado: input.idEmpleado,
      idUsuarioAsignacion: input.idUsuarioAsignacion,
      asignadoEn: fechaAsignacion,
      idUsuarioLiberacion: null,
      liberadoEn: null,
      nota: input.nota ?? null,
      claveAsignacion,
      claveLiberacion: null,
    };
    this.asignaciones.push(nueva);
    return nueva;
  }

  async liberarCupo(
    idAsignacionLicencia: string,
    idUsuarioLiberacion: string,
    claveLiberacion: string,
    fechaLiberacion: Date,
    nota?: string | null,
  ): Promise<AsignacionLicenciaDetalle> {
    const asig = this.asignaciones.find((a) => a.idAsignacionLicencia === idAsignacionLicencia);
    if (!asig) throw new Error('Asignación no encontrada');

    asig.idUsuarioLiberacion = idUsuarioLiberacion;
    asig.claveLiberacion = claveLiberacion;
    asig.liberadoEn = fechaLiberacion;
    if (nota !== undefined) asig.nota = nota;

    return asig;
  }

  async buscarAsignacionAbierta(
    idLicencia: string,
    idEmpleado: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    return (
      this.asignaciones.find(
        (a) => a.idLicencia === idLicencia && a.idEmpleado === idEmpleado && a.liberadoEn === null,
      ) ?? null
    );
  }

  async buscarAsignacionPorId(
    idAsignacionLicencia: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    return this.asignaciones.find((a) => a.idAsignacionLicencia === idAsignacionLicencia) ?? null;
  }

  async contarCuposOcupados(idLicencia: string): Promise<number> {
    return this.asignaciones.filter(
      (a) => a.idLicencia === idLicencia && a.liberadoEn === null,
    ).length;
  }

  async obtenerLicencia(idLicencia: string): Promise<Licencia | null> {
    return this.licencias.get(idLicencia) ?? null;
  }

  async obtenerEmpleado(idEmpleado: string): Promise<Empleado | null> {
    return this.empleados.get(idEmpleado) ?? null;
  }
}

class InMemoryLicenseUnitOfWork implements ILicenseUnitOfWork {
  private lock: Promise<void> = Promise.resolve();

  constructor(private readonly repository: InMemoryLicenseRepository) {}

  async executeInTransaction<T>(
    operation: (repo: ILicenseAssignmentRepository) => Promise<T>,
  ): Promise<T> {
    let releaseLock: () => void;
    const previousLock = this.lock;
    this.lock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;
    try {
      return await operation(this.repository);
    } finally {
      releaseLock!();
    }
  }
}

describe('HU06 y HU07: Asignación y Liberación de Licencias (Transacciones, Concurrencia y Resiliencia)', () => {
  let repository: InMemoryLicenseRepository;
  let unitOfWork: InMemoryLicenseUnitOfWork;
  let mockDispatcher: IAssignmentNotificationDispatcher;
  let assignHandler: AssignLicenseCommandHandler;
  let releaseHandler: ReleaseLicenseCommandHandler;

  const idLicenciaVigente = randomUUID();
  const idLicenciaVencida = randomUUID();
  const idEmpleado1 = randomUUID();
  const idEmpleado2 = randomUUID();
  const idEmpleadoInactivo = randomUUID();
  const idAdmin = randomUUID();

  const licenciaVigente: Licencia = {
    idLicencia: idLicenciaVigente,
    codigoLicencia: 'JET-DEV-2026',
    software: 'JetBrains All Products Pack',
    plan: 'Enterprise',
    periodicidad: 'Anual',
    proveedor: 'JetBrains',
    referenciaContrato: 'CONT-JB-2026',
    inicioVigencia: new Date('2026-01-01'),
    finVigencia: new Date('2027-12-31'),
    cuposContratados: 2,
    costo: '250.00',
    moneda: 'USD',
  };

  const licenciaVencida: Licencia = {
    idLicencia: idLicenciaVencida,
    codigoLicencia: 'FIG-EXP-2025',
    software: 'Figma Enterprise',
    plan: 'Enterprise',
    periodicidad: 'Anual',
    proveedor: 'Figma',
    referenciaContrato: 'CONT-FIG-2025',
    inicioVigencia: new Date('2025-01-01'),
    finVigencia: new Date('2025-12-31'),
    cuposContratados: 5,
    costo: '150.00',
    moneda: 'USD',
  };

  const empleado1: Empleado = {
    idEmpleado: idEmpleado1,
    numeroEmpleado: 'EMP-001',
    nombre: 'Ana Rojas',
    correo: 'ana.rojas@assetops.test',
    departamento: 'Desarrollo Móvil',
    cargo: 'Ingeniera de Software',
    activo: true,
    creadoEn: new Date('2026-01-01'),
    actualizadoEn: new Date('2026-01-01'),
  };

  const empleado2: Empleado = {
    idEmpleado: idEmpleado2,
    numeroEmpleado: 'EMP-002',
    nombre: 'Pedro Morales',
    correo: 'pedro.morales@assetops.test',
    departamento: 'Infraestructura',
    cargo: 'DevOps',
    activo: true,
    creadoEn: new Date('2026-01-01'),
    actualizadoEn: new Date('2026-01-01'),
  };

  const empleadoInactivo: Empleado = {
    idEmpleado: idEmpleadoInactivo,
    numeroEmpleado: 'EMP-003',
    nombre: 'Marcos Inactivo',
    correo: 'marcos@assetops.test',
    departamento: 'Soporte',
    cargo: 'Auxiliar',
    activo: false,
    creadoEn: new Date('2026-01-01'),
    actualizadoEn: new Date('2026-01-01'),
  };

  beforeEach(() => {
    repository = new InMemoryLicenseRepository();
    repository.licencias.set(licenciaVigente.idLicencia, { ...licenciaVigente });
    repository.licencias.set(licenciaVencida.idLicencia, { ...licenciaVencida });
    repository.empleados.set(empleado1.idEmpleado, { ...empleado1 });
    repository.empleados.set(empleado2.idEmpleado, { ...empleado2 });
    repository.empleados.set(empleadoInactivo.idEmpleado, { ...empleadoInactivo });

    unitOfWork = new InMemoryLicenseUnitOfWork(repository);

    mockDispatcher = {
      dispatchAssignmentEmail: jest.fn<(
        licencia: Licencia,
        empleado: Empleado,
        fechaAsignacion: Date,
        nombreUsuarioAsignacion?: string,
        nota?: string | null,
      ) => Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; sent: boolean; reason?: string }>>().mockResolvedValue({
        status: 'SENT',
        sent: true,
      }),
    };

    assignHandler = new AssignLicenseCommandHandler(unitOfWork, mockDispatcher);
    releaseHandler = new ReleaseLicenseCommandHandler(unitOfWork);
  });

  describe('1. HU06: Asignación de Licencias en Transacción Atómica', () => {
    it('debe asignar exitosamente un cupo, registrar clave de asignación y disparar correo', async () => {
      const command = new AssignLicenseCommand({
        idLicencia: licenciaVigente.idLicencia,
        idEmpleado: empleado1.idEmpleado,
        idUsuarioAsignacion: idAdmin,
        nota: 'Asignación de herramientas de desarrollo',
      });

      const resultado = await assignHandler.handle(command);

      expect(resultado.asignacion).toBeDefined();
      expect(resultado.asignacion.idLicencia).toBe(licenciaVigente.idLicencia);
      expect(resultado.asignacion.idEmpleado).toBe(empleado1.idEmpleado);
      expect(resultado.asignacion.claveAsignacion).toBeDefined();
      expect(resultado.asignacion.liberadoEn).toBeNull();
      expect(resultado.correoNotificado).toBe(true);
      expect(resultado.correoStatus).toBe('SENT');

      const cuposOcupados = await repository.contarCuposOcupados(licenciaVigente.idLicencia);
      expect(cuposOcupados).toBe(1);
      expect(mockDispatcher.dispatchAssignmentEmail).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar la asignación si el empleado ya tiene un cupo activo asignado (409)', async () => {
      const command = new AssignLicenseCommand({
        idLicencia: licenciaVigente.idLicencia,
        idEmpleado: empleado1.idEmpleado,
        idUsuarioAsignacion: idAdmin,
      });

      await assignHandler.handle(command);

      await expect(assignHandler.handle(command)).rejects.toMatchObject({
        statusCode: 409,
        message: 'El empleado ya cuenta con un cupo asignado para esta licencia',
      });
    });

    it('debe rechazar la asignación a un empleado inactivo (400)', async () => {
      const command = new AssignLicenseCommand({
        idLicencia: licenciaVigente.idLicencia,
        idEmpleado: empleadoInactivo.idEmpleado,
        idUsuarioAsignacion: idAdmin,
      });

      await expect(assignHandler.handle(command)).rejects.toMatchObject({
        statusCode: 400,
        message: 'No se puede asignar una licencia a un empleado inactivo',
      });
    });

    it('debe rechazar la asignación de una licencia vencida (400)', async () => {
      const command = new AssignLicenseCommand({
        idLicencia: licenciaVencida.idLicencia,
        idEmpleado: empleado1.idEmpleado,
        idUsuarioAsignacion: idAdmin,
      });

      await expect(assignHandler.handle(command)).rejects.toMatchObject({
        statusCode: 400,
        message: 'No se puede asignar una licencia vencida',
      });
    });
  });

  describe('2. HU06: Concurrencia en Último Cupo Simultáneo', () => {
    it('dos peticiones compitiendo por el último cupo: una gana y la otra es rechazada limpiamente sin cupos negativos', async () => {
      const licenciaUltimoCupo: Licencia = {
        ...licenciaVigente,
        idLicencia: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        codigoLicencia: 'LAST-SLOT-2026',
        cuposContratados: 1,
      };
      repository.licencias.set(licenciaUltimoCupo.idLicencia, licenciaUltimoCupo);

      const command1 = new AssignLicenseCommand({
        idLicencia: licenciaUltimoCupo.idLicencia,
        idEmpleado: empleado1.idEmpleado,
        idUsuarioAsignacion: idAdmin,
      });

      const command2 = new AssignLicenseCommand({
        idLicencia: licenciaUltimoCupo.idLicencia,
        idEmpleado: empleado2.idEmpleado,
        idUsuarioAsignacion: idAdmin,
      });

      const [res1, res2] = await Promise.allSettled([
        assignHandler.handle(command1),
        assignHandler.handle(command2),
      ]);

      const exitosos = [res1, res2].filter((r) => r.status === 'fulfilled');
      const rechazados = [res1, res2].filter((r) => r.status === 'rejected');

      expect(exitosos).toHaveLength(1);
      expect(rechazados).toHaveLength(1);

      const errorRechazo = (rechazados[0] as PromiseRejectedResult).reason;
      expect(errorRechazo).toMatchObject({
        statusCode: 409,
        message: 'No hay cupos disponibles para asignar en esta licencia',
      });

      const cuposOcupados = await repository.contarCuposOcupados(licenciaUltimoCupo.idLicencia);
      expect(cuposOcupados).toBe(1);
    });
  });

  describe('3. HU06: Resiliencia y Reintentos de Notificación por Correo', () => {
    it('debe ejecutar reintentos ante fallos temporales de SMTP y confirmar envío si se recupera', async () => {
      let intentos = 0;
      const dispatcherConReintentos: IAssignmentNotificationDispatcher = {
        dispatchAssignmentEmail: async () => {
          intentos++;
          if (intentos === 1) {
            return { status: 'FAILED', sent: false, reason: 'Timeout SMTP temporal' };
          }
          return { status: 'SENT', sent: true };
        },
      };

      const policy = new EmailRetryPolicy({ maxRetries: 3, initialDelayMs: 1 });
      const resilientDispatcher: IAssignmentNotificationDispatcher = {
        dispatchAssignmentEmail: async () =>
          policy.execute(async () =>
            dispatcherConReintentos.dispatchAssignmentEmail(
              {} as any,
              {} as any,
              new Date(),
            ),
          ),
      };

      const handler = new AssignLicenseCommandHandler(unitOfWork, resilientDispatcher);
      const resultado = await handler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      expect(resultado.asignacion).toBeDefined();
      expect(resultado.correoStatus).toBe('SENT');
      expect(resultado.correoNotificado).toBe(true);
      expect(intentos).toBe(2);
    });

    it('si el correo falla permanentemente, la asignación en BD se conserva intacta sin revertirse', async () => {
      const dispatcherFallido: IAssignmentNotificationDispatcher = {
        dispatchAssignmentEmail: jest.fn<(
          licencia: Licencia,
          empleado: Empleado,
          fechaAsignacion: Date,
          nombreUsuarioAsignacion?: string,
          nota?: string | null,
        ) => Promise<{ status: 'SENT' | 'SKIPPED' | 'FAILED'; sent: boolean; reason?: string }>>().mockResolvedValue({
          status: 'FAILED',
          sent: false,
          reason: 'Servidor SMTP inalcanzable',
        }),
      };

      const handler = new AssignLicenseCommandHandler(unitOfWork, dispatcherFallido);
      const resultado = await handler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      expect(resultado.asignacion).toBeDefined();
      expect(resultado.correoStatus).toBe('FAILED');
      expect(resultado.correoNotificado).toBe(false);

      const cuposOcupados = await repository.contarCuposOcupados(licenciaVigente.idLicencia);
      expect(cuposOcupados).toBe(1);
    });
  });

  describe('4. HU07: Liberación de Licencias (incluyendo licencias vencidas)', () => {
    it('debe liberar un cupo asignado, registrar clave de liberación y actualizar cupos libres', async () => {
      const asignacion = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      expect(await repository.contarCuposOcupados(licenciaVigente.idLicencia)).toBe(1);

      const releaseCmd = new ReleaseLicenseCommand({
        idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
        idUsuarioLiberacion: idAdmin,
        nota: 'Liberación por término de proyecto',
      });

      const resultado = await releaseHandler.handle(releaseCmd);

      expect(resultado.asignacion.liberadoEn).not.toBeNull();
      expect(resultado.asignacion.claveLiberacion).toBeDefined();
      expect(resultado.asignacion.idUsuarioLiberacion).toBe(idAdmin);
      expect(resultado.asignacion.nota).toBe('Liberación por término de proyecto');
      expect(resultado.cuposLibresActualizados).toBe(2);

      expect(await repository.contarCuposOcupados(licenciaVigente.idLicencia)).toBe(0);
    });

    it('HU07: DEBE permitir liberar cupos de LICENCIAS VENCIDAS sin bloquear por fecha', async () => {
      const asignacionVencida = await repository.asignarCupo(
        {
          idLicencia: licenciaVencida.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        },
        'f3c64811-2b02-4f3b-85df-dc0ec0785dfa',
        new Date('2025-06-01'),
      );

      expect(await repository.contarCuposOcupados(licenciaVencida.idLicencia)).toBe(1);

      const releaseCmd = new ReleaseLicenseCommand({
        idAsignacionLicencia: asignacionVencida.idAsignacionLicencia,
        idUsuarioLiberacion: idAdmin,
        nota: 'Liberación de licencia expirada para depuración',
      });

      const resultado = await releaseHandler.handle(releaseCmd);

      expect(resultado.asignacion.liberadoEn).toBeDefined();
      expect(resultado.licencia.finVigencia < new Date()).toBe(true);
      expect(resultado.cuposLibresActualizados).toBe(5);
      expect(await repository.contarCuposOcupados(licenciaVencida.idLicencia)).toBe(0);
    });

    it('debe rechazar con 400 si la asignación ya había sido liberada previamente', async () => {
      const asignacion = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      await releaseHandler.handle(
        new ReleaseLicenseCommand({
          idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
          idUsuarioLiberacion: idAdmin,
        }),
      );

      await expect(
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
            idUsuarioLiberacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'La asignación ya ha sido liberada previamente',
      });
    });

    it('debe rechazar con 404 si la asignación no existe', async () => {
      await expect(
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: 'f4b5a6c7-d8e9-4012-8345-6789abcdef01',
            idUsuarioLiberacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Asignación de licencia no encontrada',
      });
    });
  });

  describe('5. Single Action Controllers (Presentación)', () => {
    it('AssignLicenseController debe responder HTTP 201 con éxito', async () => {
      const controller = new AssignLicenseController(assignHandler);
      const req = {
        user: { idUsuario: idAdmin, versionSesion: 1 },
        params: { idLicencia: licenciaVigente.idLicencia },
        body: { idEmpleado: empleado1.idEmpleado, nota: 'Entrega inicial' },
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        },
      } as unknown as Response;

      const next = (err?: any) => {
        if (err) throw err;
      };

      await controller.execute(req, res, next);

      expect(statusCode).toBe(201);
      expect(jsonBody.status).toBe('success');
      expect(jsonBody.message).toBe('Licencia asignada exitosamente');
      expect(jsonBody.data.asignacion).toBeDefined();
    });

    it('ReleaseLicenseController debe responder HTTP 200 con éxito', async () => {
      const asig = await repository.asignarCupo(
        {
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        },
        'f3c64811-2b02-4f3b-85df-dc0ec0785dfa',
        new Date(),
      );

      const controller = new ReleaseLicenseController(releaseHandler);
      const req = {
        user: { idUsuario: idAdmin, versionSesion: 1 },
        params: { idAsignacionLicencia: asig.idAsignacionLicencia },
        body: { nota: 'Fin de contrato' },
      } as unknown as Request;

      let statusCode = 0;
      let jsonBody: any = null;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        },
      } as unknown as Response;

      const next = (err?: any) => {
        if (err) throw err;
      };

      await controller.execute(req, res, next);

      expect(statusCode).toBe(200);
      expect(jsonBody.status).toBe('success');
      expect(jsonBody.message).toBe('Licencia liberada exitosamente');
    });
  });
});

import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ILicenseHistoryReadModel } from '../../domain/contracts/licencias.js';
import type {
  AsignacionLicenciaDetalle,
  AssignLicenseInput,
  IAssignmentNotificationDispatcher,
  ILicenseAssignmentRepository,
  ILicenseUnitOfWork,
} from '../../domain/contracts/licenseAssignment.js';
import type { IMailService, MailMessage, MailSendResult } from '../../domain/contracts/mail.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import type { Empleado } from '../../domain/models/Empleado.js';
import type { Licencia, MovimientoLicenciaHistorial } from '../../domain/models/Licencia.js';
import { AssignLicenseCommand } from '../../application/commands/licencias/AssignLicenseCommand.js';
import { AssignLicenseCommandHandler } from '../../application/commands/licencias/AssignLicenseCommandHandler.js';
import { ReleaseLicenseCommand } from '../../application/commands/licencias/ReleaseLicenseCommand.js';
import { ReleaseLicenseCommandHandler } from '../../application/commands/licencias/ReleaseLicenseCommandHandler.js';
import { SendAssignmentNoticeHandler } from '../../application/commands/notifications/SendAssignmentNoticeHandler.js';
import { GetLicenseHistoryQuery } from '../../application/queries/licencias/GetLicenseHistoryQuery.js';
import { GetLicenseHistoryQueryHandler } from '../../application/queries/licencias/GetLicenseHistoryQueryHandler.js';
import { PreviewLicenseAssignmentQuery } from '../../application/queries/licencias/PreviewLicenseAssignmentQuery.js';
import { PreviewLicenseAssignmentQueryHandler } from '../../application/queries/licencias/PreviewLicenseAssignmentQueryHandler.js';
import { EmailRetryPolicy } from '../../application/services/EmailRetryPolicy.js';
import { MailTemplateRenderer } from '../../infrastructure/services/MailTemplateRenderer.js';
import { ResilientAssignmentNotificationDispatcher } from '../../infrastructure/services/ResilientAssignmentNotificationDispatcher.js';
import { AssignLicenseController } from '../../presentation/controllers/AssignLicenseController.js';
import { GetLicenseHistoryController } from '../../presentation/controllers/GetLicenseHistoryController.js';
import { PreviewLicenseAssignmentController } from '../../presentation/controllers/PreviewLicenseAssignmentController.js';
import { ReleaseLicenseController } from '../../presentation/controllers/ReleaseLicenseController.js';
import { errorHandler } from '../../presentation/middlewares/errorHandler.js';

class InMemoryLicenseRepository implements ILicenseAssignmentRepository, ILicenseHistoryReadModel {
  public licencias: Map<string, Licencia> = new Map();
  public empleados: Map<string, Empleado> = new Map();
  public usuarios: Map<string, string> = new Map();
  public asignaciones: AsignacionLicenciaDetalle[] = [];
  public failOnAsignar = false;

  async asignarCupo(
    input: AssignLicenseInput,
    claveAsignacion: string,
    fechaAsignacion: Date,
  ): Promise<AsignacionLicenciaDetalle> {
    if (this.failOnAsignar) {
      throw new Error('Fallo simulado de escritura en BD');
    }
    const duplicada = this.asignaciones.find(
      (a) => a.claveAsignacion === claveAsignacion,
    );
    if (duplicada) {
      return duplicada;
    }

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
    return { ...nueva };
  }

  async liberarCupo(
    idAsignacionLicencia: string,
    idUsuarioLiberacion: string,
    claveLiberacion: string,
    fechaLiberacion: Date,
    nota?: string | null,
  ): Promise<AsignacionLicenciaDetalle> {
    const asig = this.asignaciones.find(
      (a) => a.idAsignacionLicencia === idAsignacionLicencia && a.liberadoEn === null,
    );
    if (!asig) {
      throw new BusinessError('La asignación ya ha sido liberada previamente', 400);
    }

    asig.idUsuarioLiberacion = idUsuarioLiberacion;
    asig.claveLiberacion = claveLiberacion;
    asig.liberadoEn = fechaLiberacion;
    if (nota !== undefined) asig.nota = nota;

    return { ...asig };
  }

  async buscarAsignacionAbierta(
    idLicencia: string,
    idEmpleado: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    const found = this.asignaciones.find(
      (a) => a.idLicencia === idLicencia && a.idEmpleado === idEmpleado && a.liberadoEn === null,
    );
    return found ? { ...found } : null;
  }

  async buscarAsignacionPorId(
    idAsignacionLicencia: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    const found = this.asignaciones.find((a) => a.idAsignacionLicencia === idAsignacionLicencia);
    return found ? { ...found } : null;
  }

  async buscarAsignacionPorClave(
    claveAsignacion: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    const found = this.asignaciones.find((a) => a.claveAsignacion === claveAsignacion);
    return found ? { ...found } : null;
  }

  async buscarAsignacionPorClaveLiberacion(
    claveLiberacion: string,
  ): Promise<AsignacionLicenciaDetalle | null> {
    const found = this.asignaciones.find((a) => a.claveLiberacion === claveLiberacion);
    return found ? { ...found } : null;
  }

  async obtenerNombreUsuario(idUsuario: string): Promise<string | null> {
    return this.usuarios.get(idUsuario) ?? null;
  }

  async contarCuposOcupados(idLicencia: string): Promise<number> {
    return this.asignaciones.filter(
      (a) => a.idLicencia === idLicencia && a.liberadoEn === null,
    ).length;
  }

  async obtenerLicencia(idLicencia: string): Promise<Licencia | null> {
    const lic = this.licencias.get(idLicencia);
    return lic ? { ...lic } : null;
  }

  async obtenerEmpleado(idEmpleado: string): Promise<Empleado | null> {
    const emp = this.empleados.get(idEmpleado);
    return emp ? { ...emp } : null;
  }

  async consultarHistorial(idLicencia: string) {
    const licencia = this.licencias.get(idLicencia);
    if (!licencia) return null;

    const movimientos = this.asignaciones
      .filter((a) => a.idLicencia === idLicencia)
      .sort((a, b) => b.asignadoEn.getTime() - a.asignadoEn.getTime());

    const historial: MovimientoLicenciaHistorial[] = movimientos.map((m) => {
      const emp = this.empleados.get(m.idEmpleado)!;
      return {
        idAsignacionLicencia: m.idAsignacionLicencia,
        estado: m.liberadoEn === null ? 'ACTIVA' : 'LIBERADA',
        asignadoEn: m.asignadoEn,
        liberadoEn: m.liberadoEn,
        claveAsignacion: m.claveAsignacion,
        claveLiberacion: m.claveLiberacion,
        nota: m.nota,
        empleado: {
          idEmpleado: emp.idEmpleado,
          numeroEmpleado: emp.numeroEmpleado,
          nombre: emp.nombre,
          correo: emp.correo,
          departamento: emp.departamento,
          activo: emp.activo,
        },
        asignadoPor: {
          idUsuario: m.idUsuarioAsignacion,
          nombre: this.usuarios.get(m.idUsuarioAsignacion) ?? 'Administrador TI',
        },
        liberadoPor: m.idUsuarioLiberacion
          ? {
              idUsuario: m.idUsuarioLiberacion,
              nombre: this.usuarios.get(m.idUsuarioLiberacion) ?? 'Administrador TI',
            }
          : null,
      };
    });

    const cuposAsignados = movimientos.filter((m) => m.liberadoEn === null).length;
    return { licencia: { ...licencia }, cuposAsignados, historial };
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
    const snapshot = this.repository.asignaciones.map((a) => ({ ...a }));
    try {
      return await operation(this.repository);
    } catch (error) {
      // Simular rollback ACID ante error dentro de la transacción
      this.repository.asignaciones = snapshot;
      throw error;
    } finally {
      releaseLock!();
    }
  }
}

class InMemoryMailService implements IMailService {
  public sentMessages: MailMessage[] = [];
  public failUntilAttempt = 0;
  public attempts = 0;

  async verifyConnection(): Promise<boolean> {
    return true;
  }

  async sendMail(message: MailMessage): Promise<MailSendResult> {
    this.attempts++;
    if (this.attempts <= this.failUntilAttempt) {
      throw new Error('Error SMTP transitorio');
    }
    this.sentMessages.push(message);
    return {
      messageId: `<msg-${this.sentMessages.length}@assetops.test>`,
      accepted: [message.to],
      rejected: [],
    };
  }
}

describe('HU06 y HU07: Asignación y Liberación de Licencias (Transacciones, Concurrencia, Idempotencia, SMTP e Historial)', () => {
  let repository: InMemoryLicenseRepository;
  let unitOfWork: InMemoryLicenseUnitOfWork;
  let mailService: InMemoryMailService;
  let dispatcher: ResilientAssignmentNotificationDispatcher;
  let assignHandler: AssignLicenseCommandHandler;
  let releaseHandler: ReleaseLicenseCommandHandler;
  let previewHandler: PreviewLicenseAssignmentQueryHandler;
  let historyHandler: GetLicenseHistoryQueryHandler;

  const idLicenciaVigente = randomUUID();
  const idLicenciaVencida = randomUUID();
  const idEmpleado1 = randomUUID();
  const idEmpleado2 = randomUUID();
  const idEmpleadoInactivo = randomUUID();
  const idAdmin = randomUUID();
  const idAdmin2 = randomUUID();

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
    repository.usuarios.set(idAdmin, 'Laura Gómez');
    repository.usuarios.set(idAdmin2, 'Carlos Ruiz');

    unitOfWork = new InMemoryLicenseUnitOfWork(repository);
    mailService = new InMemoryMailService();
    const sendNoticeHandler = new SendAssignmentNoticeHandler(
      mailService,
      new MailTemplateRenderer(),
    );
    dispatcher = new ResilientAssignmentNotificationDispatcher(
      sendNoticeHandler,
      new EmailRetryPolicy({ maxRetries: 3, initialDelayMs: 1 }),
    );

    assignHandler = new AssignLicenseCommandHandler(unitOfWork, dispatcher);
    releaseHandler = new ReleaseLicenseCommandHandler(unitOfWork);
    previewHandler = new PreviewLicenseAssignmentQueryHandler(repository);
    historyHandler = new GetLicenseHistoryQueryHandler(repository);
  });

  describe('1. HU06 Escenario 06.01 y 06.02: Previsualización, Asignación Transaccional y Notificación SMTP', () => {
    it('previsualiza puestos libres resultantes en Paso 2, asigna cupo y notifica por correo SMTP con nombre del administrador', async () => {
      const preview = await previewHandler.handle(
        new PreviewLicenseAssignmentQuery({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
        }),
      );

      expect(preview.puedeAsignar).toBe(true);
      expect(preview.motivoRechazo).toBeNull();
      expect(preview.cuposLibresActuales).toBe(2);
      expect(preview.cuposLibresResultantes).toBe(1);
      expect(preview.porcentajeOcupacionActual).toBe(0);
      expect(preview.porcentajeOcupacionResultante).toBe(50);

      const resultado = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
          nota: 'Asignación de herramientas de desarrollo',
        }),
      );

      expect(resultado.asignacion).toBeDefined();
      expect(resultado.asignacion.idLicencia).toBe(licenciaVigente.idLicencia);
      expect(resultado.asignacion.idEmpleado).toBe(empleado1.idEmpleado);
      expect(resultado.asignacion.claveAsignacion).toBeDefined();
      expect(resultado.asignacion.liberadoEn).toBeNull();
      expect(resultado.cuposAsignados).toBe(1);
      expect(resultado.cuposLibresResultantes).toBe(1);
      expect(resultado.cuposLibresActualizados).toBe(1);
      expect(resultado.porcentajeOcupacion).toBe(50);
      expect(resultado.reintentoRecuperado).toBe(false);
      expect(resultado.correoNotificado).toBe(true);
      expect(resultado.correoStatus).toBe('SENT');

      expect(mailService.sentMessages).toHaveLength(1);
      expect(mailService.sentMessages[0]?.to).toBe(empleado1.correo);
      expect(mailService.sentMessages[0]?.html).toContain('JetBrains All Products Pack');
      expect(mailService.sentMessages[0]?.html).toContain('Laura Gómez');
    });

    it('rechaza si el empleado ya tiene un cupo activo (409) sin crear otro movimiento ni enviar correo', async () => {
      await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVigente.idLicencia,
            idEmpleado: empleado1.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'El empleado ya cuenta con un cupo asignado para esta licencia',
      });

      expect(repository.asignaciones).toHaveLength(1);
      expect(mailService.sentMessages).toHaveLength(1);
    });

    it('rechaza asignación a empleado inactivo (400), licencia vencida (400) y sin cupos (409)', async () => {
      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVigente.idLicencia,
            idEmpleado: empleadoInactivo.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'No se puede asignar una licencia a un empleado inactivo',
      });

      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVencida.idLicencia,
            idEmpleado: empleado1.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'No se puede asignar una licencia vencida',
      });

      expect(repository.asignaciones).toHaveLength(0);
      expect(mailService.sentMessages).toHaveLength(0);
    });

    it('si falla la transacción en BD se hace rollback y NO se dispara notificación por correo', async () => {
      repository.failOnAsignar = true;

      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVigente.idLicencia,
            idEmpleado: empleado1.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
      ).rejects.toThrow('Fallo simulado de escritura en BD');

      expect(await repository.contarCuposOcupados(licenciaVigente.idLicencia)).toBe(0);
      expect(mailService.sentMessages).toHaveLength(0);
    });
  });

  describe('2. HU06 Escenario 06.03: Último Cupo y Concurrencia', () => {
    it('dos administradores compitiendo simultáneamente por el último cupo: uno gana y el otro recibe rechazo de cupos agotados sin exceder lo contratado', async () => {
      const licenciaUltimoCupo: Licencia = {
        ...licenciaVigente,
        idLicencia: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        codigoLicencia: 'LAST-SLOT-2026',
        cuposContratados: 1,
      };
      repository.licencias.set(licenciaUltimoCupo.idLicencia, licenciaUltimoCupo);

      const [res1, res2] = await Promise.allSettled([
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaUltimoCupo.idLicencia,
            idEmpleado: empleado1.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaUltimoCupo.idLicencia,
            idEmpleado: empleado2.idEmpleado,
            idUsuarioAsignacion: idAdmin2,
          }),
        ),
      ]);

      const exitosos = [res1, res2].filter((r) => r.status === 'fulfilled');
      const rechazados = [res1, res2].filter((r) => r.status === 'rejected');

      expect(exitosos).toHaveLength(1);
      expect(rechazados).toHaveLength(1);

      const ganador = (exitosos[0] as PromiseFulfilledResult<any>).value;
      expect(ganador.cuposLibresResultantes).toBe(0);
      expect(ganador.porcentajeOcupacion).toBe(100);

      const errorRechazo = (rechazados[0] as PromiseRejectedResult).reason;
      expect(errorRechazo).toMatchObject({
        statusCode: 409,
        message: 'No hay cupos disponibles para asignar en esta licencia',
      });

      const cuposOcupados = await repository.contarCuposOcupados(licenciaUltimoCupo.idLicencia);
      expect(cuposOcupados).toBe(1);
      expect(mailService.sentMessages).toHaveLength(1);
    });
  });

  describe('3. HU06 Escenario 06.04: Reintentos de Asignación (Idempotencia de Red) y Resiliencia SMTP', () => {
    it('al reintentar con la misma claveAsignacion tras caída de red, recupera el movimiento previo sin consumir un cupo adicional ni duplicar correo', async () => {
      const claveIdempotencia = randomUUID();

      const primera = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
          claveAsignacion: claveIdempotencia,
          nota: 'Intento inicial',
        }),
      );

      expect(primera.reintentoRecuperado).toBe(false);
      expect(primera.cuposLibresResultantes).toBe(1);
      expect(mailService.sentMessages).toHaveLength(1);

      // Reintento con los mismos datos tras perder la respuesta de red
      const reintento = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
          claveAsignacion: claveIdempotencia,
          nota: 'Intento inicial',
        }),
      );

      expect(reintento.reintentoRecuperado).toBe(true);
      expect(reintento.asignacion.idAsignacionLicencia).toBe(
        primera.asignacion.idAsignacionLicencia,
      );
      expect(reintento.asignacion.claveAsignacion).toBe(claveIdempotencia);
      expect(reintento.cuposAsignados).toBe(1);
      expect(reintento.cuposLibresResultantes).toBe(1);
      expect(reintento.correoStatus).toBe('SKIPPED');
      expect(repository.asignaciones).toHaveLength(1);
      expect(mailService.sentMessages).toHaveLength(1);
    });

    it('rechaza con 409 si se reutiliza una claveAsignacion en otro empleado o licencia distinta', async () => {
      const claveIdempotencia = randomUUID();

      await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
          claveAsignacion: claveIdempotencia,
        }),
      );

      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVigente.idLicencia,
            idEmpleado: empleado2.idEmpleado,
            idUsuarioAsignacion: idAdmin,
            claveAsignacion: claveIdempotencia,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'La clave de asignación ya fue utilizada en otro movimiento',
      });
    });

    it('ejecuta reintentos SMTP ante fallos temporales y conserva la asignación si SMTP falla permanentemente', async () => {
      mailService.failUntilAttempt = 1;
      const resultadoRecuperado = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );
      expect(resultadoRecuperado.correoStatus).toBe('SENT');
      expect(resultadoRecuperado.correoNotificado).toBe(true);
      expect(mailService.attempts).toBe(2);

      // Falla permanente en las 3 tentativas
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mailService.attempts = 0;
      mailService.failUntilAttempt = 10;

      const resultadoFallido = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado2.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      expect(resultadoFallido.asignacion).toBeDefined();
      expect(resultadoFallido.correoStatus).toBe('FAILED');
      expect(resultadoFallido.correoNotificado).toBe(false);
      expect(await repository.contarCuposOcupados(licenciaVigente.idLicencia)).toBe(2);
      warnSpy.mockRestore();
    });
  });

  describe('4. HU07 Escenarios 07.01 y 07.02: Liberación Correcta, Fechas, Historial y Licencias Vencidas', () => {
    it('libera un cupo con fecha válida, registra administrador y clave de liberación, actualiza ocupación y conserva historial', async () => {
      const asignacion = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      const fechaLiberacion = new Date(asignacion.asignacion.asignadoEn.getTime() + 1000);
      const resultado = await releaseHandler.handle(
        new ReleaseLicenseCommand({
          idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
          idUsuarioLiberacion: idAdmin2,
          fechaLiberacion,
          nota: 'Liberación por término de proyecto',
        }),
      );

      expect(resultado.asignacion.liberadoEn).toEqual(fechaLiberacion);
      expect(resultado.asignacion.claveLiberacion).toBeDefined();
      expect(resultado.asignacion.idUsuarioLiberacion).toBe(idAdmin2);
      expect(resultado.asignacion.nota).toBe('Liberación por término de proyecto');
      expect(resultado.cuposAsignados).toBe(0);
      expect(resultado.cuposLibresActualizados).toBe(2);
      expect(resultado.cuposAsignables).toBe(2);
      expect(resultado.porcentajeOcupacion).toBe(0);

      // Verificar que el historial conserva el movimiento cerrado
      const historial = await historyHandler.handle(
        new GetLicenseHistoryQuery(licenciaVigente.idLicencia),
      );
      expect(historial.historial).toHaveLength(1);
      expect(historial.historial[0]).toMatchObject({
        idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
        estado: 'LIBERADA',
        asignadoPor: { idUsuario: idAdmin, nombre: 'Laura Gómez' },
        liberadoPor: { idUsuario: idAdmin2, nombre: 'Carlos Ruiz' },
      });
    });

    it('rechaza fechas de liberación inválidas (futura o anterior a la asignación)', async () => {
      const asignacion = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      await expect(
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
            idUsuarioLiberacion: idAdmin,
            fechaLiberacion: new Date(asignacion.asignacion.asignadoEn.getTime() - 60_000),
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'La fecha de liberación no puede ser anterior a la fecha de asignación',
      });

      await expect(
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
            idUsuarioLiberacion: idAdmin,
            fechaLiberacion: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'La fecha de liberación no puede ser futura',
      });

      // La asignación sigue abierta
      expect(await repository.contarCuposOcupados(licenciaVigente.idLicencia)).toBe(1);
    });

    it('HU07 Escenario 07.02: libera cupo de licencia VENCIDA cerrándola en historial SIN habilitar nuevas asignaciones', async () => {
      const asignacionVencida = await repository.asignarCupo(
        {
          idLicencia: licenciaVencida.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        },
        randomUUID(),
        new Date('2025-06-01T10:00:00.000Z'),
      );

      expect(await repository.contarCuposOcupados(licenciaVencida.idLicencia)).toBe(1);

      const resultado = await releaseHandler.handle(
        new ReleaseLicenseCommand({
          idAsignacionLicencia: asignacionVencida.idAsignacionLicencia,
          idUsuarioLiberacion: idAdmin,
          fechaLiberacion: '2026-11-24',
          nota: 'Liberación de licencia expirada para depuración',
        }),
      );

      expect(resultado.asignacion.liberadoEn).not.toBeNull();
      expect(resultado.estadoLicencia).toBe('VENCIDA');
      expect(resultado.cuposAsignados).toBe(0);
      expect(resultado.cuposLibresActualizados).toBe(5);
      expect(resultado.cuposAsignables).toBe(0);
      expect(resultado.porcentajeOcupacion).toBe(0);

      // Historial cerrado
      const historial = await historyHandler.handle(
        new GetLicenseHistoryQuery(licenciaVencida.idLicencia),
      );
      expect(historial.historial).toHaveLength(1);
      expect(historial.historial[0]?.estado).toBe('LIBERADA');
      expect(historial.cuposAsignables).toBe(0);

      // Intentar asignar el cupo liberado sigue estando prohibido por contrato vencido
      await expect(
        assignHandler.handle(
          new AssignLicenseCommand({
            idLicencia: licenciaVencida.idLicencia,
            idEmpleado: empleado2.idEmpleado,
            idUsuarioAsignacion: idAdmin,
          }),
        ),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'No se puede asignar una licencia vencida',
      });
    });

    it('dos liberaciones simultáneas sobre la misma asignación: solo una tiene éxito y la otra recibe 400', async () => {
      const asignacion = await assignHandler.handle(
        new AssignLicenseCommand({
          idLicencia: licenciaVigente.idLicencia,
          idEmpleado: empleado1.idEmpleado,
          idUsuarioAsignacion: idAdmin,
        }),
      );

      const [r1, r2] = await Promise.allSettled([
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
            idUsuarioLiberacion: idAdmin,
          }),
        ),
        releaseHandler.handle(
          new ReleaseLicenseCommand({
            idAsignacionLicencia: asignacion.asignacion.idAsignacionLicencia,
            idUsuarioLiberacion: idAdmin2,
          }),
        ),
      ]);

      const exitosos = [r1, r2].filter((r) => r.status === 'fulfilled');
      const rechazados = [r1, r2].filter((r) => r.status === 'rejected');

      expect(exitosos).toHaveLength(1);
      expect(rechazados).toHaveLength(1);
      expect((rechazados[0] as PromiseRejectedResult).reason).toMatchObject({
        statusCode: 400,
        message: 'La asignación ya ha sido liberada previamente',
      });
    });

    it('rechaza con 404 si la asignación no existe', async () => {
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

  describe('5. Integración Presentación (Controladores, Zod, Idempotency-Key y ErrorHandler)', () => {
    async function invokeWithErrorHandler(
      handler: RequestHandler,
      reqPartial: Partial<Request>,
    ): Promise<{ status: number; body: any }> {
      let status = 200;
      let body: any = null;
      const req = {
        user: { idUsuario: idAdmin, versionSesion: 0 },
        params: {},
        query: {},
        body: {},
        headers: {},
        ...reqPartial,
      } as unknown as Request;

      const res = {
        status(code: number) {
          status = code;
          return res;
        },
        json(payload: any) {
          body = payload;
          return res;
        },
      } as unknown as Response;

      let capturedErr: unknown;
      const next: NextFunction = (err?: unknown) => {
        capturedErr = err;
      };

      await handler(req, res, next);
      if (capturedErr !== undefined) {
        errorHandler(capturedErr, req, res, (() => {}) as NextFunction);
      }

      return { status, body };
    }

    it('flujo completo HTTP: previsualizar -> asignar (201) -> reintentar con Idempotency-Key (200) -> liberar con fecha (200) -> consultar historial (200)', async () => {
      const assignCtrl = new AssignLicenseController(assignHandler);
      const releaseCtrl = new ReleaseLicenseController(releaseHandler);
      const previewCtrl = new PreviewLicenseAssignmentController(previewHandler);
      const historyCtrl = new GetLicenseHistoryController(historyHandler);
      const idempotencyKey = randomUUID();

      // 1. Previsualización Paso 2
      const previewRes = await invokeWithErrorHandler(previewCtrl.execute, {
        params: { idLicencia: licenciaVigente.idLicencia },
        query: { idEmpleado: empleado1.idEmpleado },
      });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.puedeAsignar).toBe(true);
      expect(previewRes.body.data.cuposLibresResultantes).toBe(1);

      // 2. Asignación inicial
      const assignRes = await invokeWithErrorHandler(assignCtrl.execute, {
        params: { idLicencia: licenciaVigente.idLicencia },
        headers: { 'idempotency-key': idempotencyKey },
        body: { idEmpleado: empleado1.idEmpleado, nota: 'Entrega HTTP' },
      });

      expect(assignRes.status).toBe(201);
      expect(assignRes.body.message).toBe('Licencia asignada exitosamente');
      expect(assignRes.body.data.cuposLibresResultantes).toBe(1);
      expect(assignRes.body.data.correoNotificado).toBe(true);
      const idAsignacion = assignRes.body.data.asignacion.idAsignacionLicencia;

      // 3. Reintento con misma Idempotency-Key -> recupera 200 sin consumir otro cupo
      const retryRes = await invokeWithErrorHandler(assignCtrl.execute, {
        params: { idLicencia: licenciaVigente.idLicencia },
        headers: { 'idempotency-key': idempotencyKey },
        body: { idEmpleado: empleado1.idEmpleado, nota: 'Entrega HTTP' },
      });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.reintentoRecuperado).toBe(true);
      expect(retryRes.body.data.asignacion.idAsignacionLicencia).toBe(idAsignacion);
      expect(retryRes.body.data.cuposAsignados).toBe(1);

      // 4. Liberar con fecha válida
      const hoyISO = new Date().toISOString().slice(0, 10);
      const releaseRes = await invokeWithErrorHandler(releaseCtrl.execute, {
        params: { idAsignacionLicencia: idAsignacion },
        body: { fechaLiberacion: hoyISO, nota: 'Devolución en tiempo' },
      });

      expect(releaseRes.status).toBe(200);
      expect(releaseRes.body.data.cuposLibresActualizados).toBe(2);
      expect(releaseRes.body.data.porcentajeOcupacion).toBe(0);

      // 5. Consultar historial
      const historyRes = await invokeWithErrorHandler(historyCtrl.execute, {
        params: { idLicencia: licenciaVigente.idLicencia },
      });

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.historial).toHaveLength(1);
      expect(historyRes.body.data.historial[0].estado).toBe('LIBERADA');
    });

    it('valida errores de entrada con Zod devolviendo HTTP 400 mediante errorHandler', async () => {
      const assignCtrl = new AssignLicenseController(assignHandler);

      const resInvalid = await invokeWithErrorHandler(assignCtrl.execute, {
        params: { idLicencia: licenciaVigente.idLicencia },
        headers: { 'idempotency-key': 'no-es-uuid' },
        body: { idEmpleado: empleado1.idEmpleado },
      });

      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.status).toBe('error');
    });
  });

  describe('6. Single Action Controllers directos (Presentación)', () => {
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

      await controller.execute(req, res, (err?: any) => {
        if (err) throw err;
      });

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
        randomUUID(),
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

      await controller.execute(req, res, (err?: any) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(200);
      expect(jsonBody.status).toBe('success');
      expect(jsonBody.message).toBe('Licencia liberada exitosamente');
    });
  });
});

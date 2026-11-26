import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import type { IEmpleadoReadModel, IEmpleadoRepository } from '../../domain/contracts/empleados.js';
import type { DatosCrearEmpleado, DatosEditarEmpleado, Empleado, EmpleadoResumen } from '../../domain/models/Empleado.js';
import { RegistrarEmpleadoHandler } from '../../application/commands/empleados/RegistrarEmpleadoHandler.js';
import { EditarEmpleadoHandler } from '../../application/commands/empleados/EditarEmpleadoHandler.js';
import { DesactivarEmpleadoHandler } from '../../application/commands/empleados/DesactivarEmpleadoHandler.js';
import { ListarEmpleadosHandler } from '../../application/queries/empleados/ListarEmpleadosHandler.js';
import {
  DesactivarEmpleadoController,
  EditarEmpleadoController,
  ListarEmpleadosController,
  RegistrarEmpleadoController,
} from '../../presentation/controllers/EmpleadoControllers.js';
import {
  editarEmpleadoSchema,
  parametrosEmpleadoSchema,
  registroEmpleadoSchema,
} from '../../presentation/validators/empleadoValidator.js';
import { BusinessError } from '../../domain/exceptions/BusinessError.js';
import { ValidationError } from '../../domain/exceptions/ValidationError.js';

class InMemoryEmpleadoRepository implements IEmpleadoRepository, IEmpleadoReadModel {
  public empleados: Empleado[] = [];
  public licenciasActivasMap: Map<string, number> = new Map();

  async crear(datos: DatosCrearEmpleado): Promise<Empleado> {
    const nuevo: Empleado = {
      idEmpleado: `emp-${this.empleados.length + 1}`,
      numeroEmpleado: datos.numeroEmpleado,
      nombre: datos.nombre,
      correo: datos.correo,
      departamento: datos.departamento,
      cargo: datos.cargo,
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };
    this.empleados.push(nuevo);
    return nuevo;
  }

  async editar(idEmpleado: string, datos: DatosEditarEmpleado): Promise<Empleado> {
    const index = this.empleados.findIndex((e) => e.idEmpleado === idEmpleado);
    if (index === -1) {
      throw new BusinessError('Empleado no encontrado', 404);
    }
    const actualizado: Empleado = {
      ...this.empleados[index],
      ...datos,
      actualizadoEn: new Date(),
    };
    this.empleados[index] = actualizado;
    return actualizado;
  }

  async desactivar(idEmpleado: string): Promise<Empleado> {
    const index = this.empleados.findIndex((e) => e.idEmpleado === idEmpleado);
    if (index === -1) {
      throw new BusinessError('Empleado no encontrado', 404);
    }
    this.empleados[index].activo = false;
    this.empleados[index].actualizadoEn = new Date();
    return this.empleados[index];
  }

  async buscarPorId(idEmpleado: string): Promise<Empleado | null> {
    return this.empleados.find((e) => e.idEmpleado === idEmpleado) ?? null;
  }

  async buscarPorCorreo(correo: string): Promise<Empleado | null> {
    return this.empleados.find((e) => e.correo.toLowerCase() === correo.toLowerCase()) ?? null;
  }

  async buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null> {
    return this.empleados.find((e) => e.numeroEmpleado === numeroEmpleado) ?? null;
  }

  async contarLicenciasActivas(idEmpleado: string): Promise<number> {
    return this.licenciasActivasMap.get(idEmpleado) ?? 0;
  }

  async contarActivosAsignados(): Promise<number> {
    return 0;
  }

  async listar(): Promise<EmpleadoResumen[]> {
    return this.empleados.map((e) => ({
      ...e,
      licenciasAsignadas: this.licenciasActivasMap.get(e.idEmpleado) ?? 0,
    }));
  }

  async consultar(idEmpleado: string): Promise<EmpleadoResumen | null> {
    const emp = await this.buscarPorId(idEmpleado);
    if (!emp) return null;
    return {
      ...emp,
      licenciasAsignadas: this.licenciasActivasMap.get(idEmpleado) ?? 0,
    };
  }
}

describe('HU03 y HU04: Gestión de Empleados (Clean Architecture + CQRS)', () => {
  let repo: InMemoryEmpleadoRepository;
  let mockWelcomeHandler: { handle: jest.Mock<(...args: any[]) => Promise<any>> };
  let registrarHandler: RegistrarEmpleadoHandler;
  let editarHandler: EditarEmpleadoHandler;
  let desactivarHandler: DesactivarEmpleadoHandler;
  let listarHandler: ListarEmpleadosHandler;

  beforeEach(() => {
    repo = new InMemoryEmpleadoRepository();
    mockWelcomeHandler = {
      handle: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({
        status: 'SENT',
        sent: true,
      }),
    };
    registrarHandler = new RegistrarEmpleadoHandler(repo, mockWelcomeHandler);
    editarHandler = new EditarEmpleadoHandler(repo);
    desactivarHandler = new DesactivarEmpleadoHandler(repo);
    listarHandler = new ListarEmpleadosHandler(repo);
  });

  describe('Validadores Zod (empleadoValidator)', () => {
    const empleadoValido = {
      nombre: 'Ana Morales',
      correo: 'ana.morales@empresa.com',
      numeroEmpleado: 'EMP-001',
      departamento: 'Tecnología',
      cargo: 'Desarrolladora Fullstack',
      enviarCorreoBienvenida: true,
    };

    it('acepta datos de registro válidos y normaliza el correo', () => {
      const parsed = registroEmpleadoSchema.parse(empleadoValido);
      expect(parsed.correo).toBe('ana.morales@empresa.com');
      expect(parsed.numeroEmpleado).toBe('EMP-001');
    });

    it('rechaza registro con correo inválido o campos vacíos', () => {
      expect(registroEmpleadoSchema.safeParse({ ...empleadoValido, correo: 'no-es-correo' }).success).toBe(false);
      expect(registroEmpleadoSchema.safeParse({ ...empleadoValido, nombre: '   ' }).success).toBe(false);
      expect(registroEmpleadoSchema.safeParse({ ...empleadoValido, numeroEmpleado: '' }).success).toBe(false);
      expect(registroEmpleadoSchema.safeParse({ ...empleadoValido, departamento: '' }).success).toBe(false);
      expect(registroEmpleadoSchema.safeParse({ ...empleadoValido, cargo: '' }).success).toBe(false);
    });

    it('valida UUID en parámetros de ruta', () => {
      expect(parametrosEmpleadoSchema.safeParse({ id: 'be7648ae-c038-4b69-a9b4-a06eaa61d3b1' }).success).toBe(true);
      expect(parametrosEmpleadoSchema.safeParse({ id: 'id-no-uuid' }).success).toBe(false);
    });
  });

  describe('HU03: Registrar Empleados (Escenarios 03.01 y 03.02)', () => {
    it('crea el empleado con activo: true y sin registrarlo en la tabla Usuarios', async () => {
      const empleado = await registrarHandler.handle({
        nombre: 'Carlos Mendoza',
        correo: 'carlos.mendoza@empresa.com',
        numeroEmpleado: 'EMP-100',
        departamento: 'Operaciones',
        cargo: 'Analista de Sistemas',
        enviarCorreoBienvenida: false,
      });

      expect(empleado.idEmpleado).toBeDefined();
      expect(empleado.activo).toBe(true);
      expect(empleado.numeroEmpleado).toBe('EMP-100');
      expect(mockWelcomeHandler.handle).not.toHaveBeenCalled();
    });

    it('dispara el correo de bienvenida cuando enviarCorreoBienvenida es true', async () => {
      await registrarHandler.handle({
        nombre: 'Beatriz Silva',
        correo: 'beatriz.silva@empresa.com',
        numeroEmpleado: 'EMP-101',
        departamento: 'Recursos Humanos',
        cargo: 'Coordinadora de Talento',
        enviarCorreoBienvenida: true,
      });

      expect(mockWelcomeHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockWelcomeHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Beatriz Silva',
          correo: 'beatriz.silva@empresa.com',
          tipoDestinatario: 'EMPLEADO',
          enviarCorreo: true,
          numeroEmpleado: 'EMP-101',
          departamento: 'Recursos Humanos',
        }),
      );
    });

    it('rechaza con BusinessError 409 si el correo ya está registrado', async () => {
      await registrarHandler.handle({
        nombre: 'Empleado Uno',
        correo: 'duplicado@empresa.com',
        numeroEmpleado: 'EMP-001',
        departamento: 'TI',
        cargo: 'Dev',
      });

      await expect(
        registrarHandler.handle({
          nombre: 'Empleado Dos',
          correo: 'duplicado@empresa.com',
          numeroEmpleado: 'EMP-002',
          departamento: 'Finanzas',
          cargo: 'Contador',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'El correo electrónico ya está registrado',
      });
    });

    it('rechaza con BusinessError 409 si el número de empleado ya está registrado', async () => {
      await registrarHandler.handle({
        nombre: 'Empleado Uno',
        correo: 'uno@empresa.com',
        numeroEmpleado: 'EMP-DUP',
        departamento: 'TI',
        cargo: 'Dev',
      });

      await expect(
        registrarHandler.handle({
          nombre: 'Empleado Dos',
          correo: 'dos@empresa.com',
          numeroEmpleado: 'EMP-DUP',
          departamento: 'Ventas',
          cargo: 'Ejecutivo',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'El número de empleado ya está registrado',
      });
    });
  });

  describe('HU03: Listar Empleados con Licencias Asignadas (Escenario 03.03)', () => {
    it('retorna la lista de empleados incluyendo licenciasAsignadas: number', async () => {
      const emp1 = await repo.crear({
        nombre: 'David R.',
        correo: 'david@empresa.com',
        numeroEmpleado: 'EMP-201',
        departamento: 'TI',
        cargo: 'Soporte',
      });
      const emp2 = await repo.crear({
        nombre: 'Elena M.',
        correo: 'elena@empresa.com',
        numeroEmpleado: 'EMP-202',
        departamento: 'Diseño',
        cargo: 'UX Designer',
      });

      // Asignar 3 licencias activas a emp1 y 0 a emp2
      repo.licenciasActivasMap.set(emp1.idEmpleado, 3);

      const lista = await listarHandler.handle();
      expect(lista).toHaveLength(2);

      const e1 = lista.find((e) => e.idEmpleado === emp1.idEmpleado);
      const e2 = lista.find((e) => e.idEmpleado === emp2.idEmpleado);

      expect(e1?.licenciasAsignadas).toBe(3);
      expect(e2?.licenciasAsignadas).toBe(0);
    });
  });

  describe('HU04: Editar Empleados (Escenario 04.01)', () => {
    it('actualiza los datos del empleado conservando su id y estado', async () => {
      const creado = await repo.crear({
        nombre: 'Fernando Gómez',
        correo: 'fernando@empresa.com',
        numeroEmpleado: 'EMP-301',
        departamento: 'Marketing',
        cargo: 'Especialista SEO',
      });

      const editado = await editarHandler.handle({
        idEmpleado: creado.idEmpleado,
        nombre: 'Fernando Gómez Herrera',
        correo: 'fernando.gomez@empresa.com',
        numeroEmpleado: 'EMP-301-B',
        departamento: 'Growth Marketing',
        cargo: 'Lead Growth',
      });

      expect(editado.nombre).toBe('Fernando Gómez Herrera');
      expect(editado.correo).toBe('fernando.gomez@empresa.com');
      expect(editado.departamento).toBe('Growth Marketing');
      expect(editado.activo).toBe(true);
    });

    it('rechaza edición con 404 si el empleado no existe', async () => {
      await expect(
        editarHandler.handle({
          idEmpleado: 'no-existe-uuid',
          nombre: 'Nadie',
          correo: 'nadie@empresa.com',
          numeroEmpleado: 'EMP-999',
          departamento: 'Ninguno',
          cargo: 'Ninguno',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rechaza edición si el nuevo correo pertenece a otro empleado distinto', async () => {
      await repo.crear({
        nombre: 'Otro Empleado',
        correo: 'ocupado@empresa.com',
        numeroEmpleado: 'EMP-401',
        departamento: 'TI',
        cargo: 'Dev',
      });
      const objetivo = await repo.crear({
        nombre: 'Objetivo',
        correo: 'objetivo@empresa.com',
        numeroEmpleado: 'EMP-402',
        departamento: 'TI',
        cargo: 'Dev',
      });

      await expect(
        editarHandler.handle({
          idEmpleado: objetivo.idEmpleado,
          nombre: 'Objetivo Modificado',
          correo: 'ocupado@empresa.com',
          numeroEmpleado: 'EMP-402',
          departamento: 'TI',
          cargo: 'Dev',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'El correo electrónico ya está registrado por otro empleado',
      });
    });

    it('rechaza edición si el nuevo número de empleado pertenece a otro empleado', async () => {
      await repo.crear({
        nombre: 'Primer Empleado',
        correo: 'primero@empresa.com',
        numeroEmpleado: 'EMP-501',
        departamento: 'TI',
        cargo: 'Dev',
      });
      const objetivo = await repo.crear({
        nombre: 'Segundo Empleado',
        correo: 'segundo@empresa.com',
        numeroEmpleado: 'EMP-502',
        departamento: 'TI',
        cargo: 'Dev',
      });

      await expect(
        editarHandler.handle({
          idEmpleado: objetivo.idEmpleado,
          nombre: 'Segundo Modificado',
          correo: 'segundo@empresa.com',
          numeroEmpleado: 'EMP-501',
          departamento: 'TI',
          cargo: 'Dev',
        }),
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'El número de empleado ya está registrado por otro empleado',
      });
    });
  });

  describe('HU04: Desactivar Empleados (Escenarios 04.02 y 04.03)', () => {
    it('permite desactivar si el empleado tiene 0 licencias activas asignadas', async () => {
      const emp = await repo.crear({
        nombre: 'Gabriela Paz',
        correo: 'gabriela@empresa.com',
        numeroEmpleado: 'EMP-601',
        departamento: 'Legal',
        cargo: 'Abogada Corporativa',
      });

      repo.licenciasActivasMap.set(emp.idEmpleado, 0);

      const desactivado = await desactivarHandler.handle({ idEmpleado: emp.idEmpleado });
      expect(desactivado.activo).toBe(false);
    });

    it('BLOQUEA la desactivación arrojando BusinessError 409 si tiene 1 o más licencias asignadas activas', async () => {
      const emp = await repo.crear({
        nombre: 'Hector Ramos',
        correo: 'hector@empresa.com',
        numeroEmpleado: 'EMP-602',
        departamento: 'Ingeniería',
        cargo: 'Arquitecto Cloud',
      });

      // Empleado con 2 licencias activas sin liberar
      repo.licenciasActivasMap.set(emp.idEmpleado, 2);

      await expect(desactivarHandler.handle({ idEmpleado: emp.idEmpleado })).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('No se puede desactivar el empleado porque tiene licencias activas asignadas'),
      });

      // El empleado debe permanecer activo
      const persistido = await repo.buscarPorId(emp.idEmpleado);
      expect(persistido?.activo).toBe(true);
    });

    it('rechaza desactivación con 404 si el empleado no existe', async () => {
      await expect(desactivarHandler.handle({ idEmpleado: 'id-fantasma' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('Controladores Express (EmpleadoControllers)', () => {
    function crearRespuestaMock(): Response {
      const res = {} as Partial<Response>;
      res.status = jest.fn<any>().mockReturnValue(res);
      res.json = jest.fn<any>().mockReturnValue(res);
      return res as Response;
    }

    it('RegistrarEmpleadoController responde con 201 y mensaje de éxito', async () => {
      const controller = new RegistrarEmpleadoController(registrarHandler);
      const req = {
        body: {
          nombre: 'Irene V.',
          correo: 'irene@empresa.com',
          numeroEmpleado: 'EMP-701',
          departamento: 'Ventas',
          cargo: 'Account Executive',
        },
      } as Request;
      const res = crearRespuestaMock();
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Empleado registrado exitosamente',
        }),
      );
    });

    it('ListarEmpleadosController responde con 200 y mensaje de éxito', async () => {
      const controller = new ListarEmpleadosController(listarHandler);
      const req = {} as Request;
      const res = crearRespuestaMock();
      const next = jest.fn();

      await controller.execute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Empleados consultados exitosamente',
        }),
      );
    });
  });
});

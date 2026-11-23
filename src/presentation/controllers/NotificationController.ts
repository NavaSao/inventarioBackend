import type { Request, Response, NextFunction } from 'express';
import { SendWelcomeEmailCommand } from '../../application/commands/notifications/SendWelcomeEmailCommand.js';
import type { SendWelcomeEmailHandler } from '../../application/commands/notifications/SendWelcomeEmailHandler.js';
import { SendAssignmentNoticeCommand } from '../../application/commands/notifications/SendAssignmentNoticeCommand.js';
import type { SendAssignmentNoticeHandler } from '../../application/commands/notifications/SendAssignmentNoticeHandler.js';
import type { AssignmentNoticeData } from '../../domain/contracts/mail.js';
import { ResponseBuilder } from '../../infrastructure/utils/responseBuilder.js';

export interface NotificationControllerDeps {
  sendWelcomeEmailHandler: SendWelcomeEmailHandler;
  sendAssignmentNoticeHandler: SendAssignmentNoticeHandler;
}

export const notificationControllerFactory = ({
  sendWelcomeEmailHandler,
  sendAssignmentNoticeHandler,
}: NotificationControllerDeps) => ({
  // Command (HU03): POST /api/notificaciones/bienvenida
  enviarBienvenida: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nombre, correo, tipoDestinatario, enviarCorreo, numeroEmpleado, departamento } = req.body;
      const command = new SendWelcomeEmailCommand(
        nombre,
        correo,
        tipoDestinatario,
        enviarCorreo,
        numeroEmpleado,
        departamento,
      );

      const result = await sendWelcomeEmailHandler.handle(command);
      const message =
        result.status === 'SENT'
          ? 'Correo de bienvenida enviado exitosamente'
          : result.status === 'SKIPPED'
            ? 'Correo de bienvenida omitido opcionalmente'
            : 'No se pudo enviar el correo de bienvenida, pero el flujo principal no fue interrumpido';

      ResponseBuilder.success(res, result, message);
    } catch (error) {
      next(error);
    }
  },

  // Command (HU06): POST /api/notificaciones/asignacion
  enviarAvisoAsignacion: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body;
      const fechaAsignacion = body.fechaAsignacion ? new Date(body.fechaAsignacion) : new Date();

      const payload: AssignmentNoticeData =
        body.tipo === 'ACTIVO'
          ? {
              tipo: 'ACTIVO',
              nombreEmpleado: body.nombreEmpleado,
              correoEmpleado: body.correoEmpleado,
              numeroEmpleado: body.numeroEmpleado,
              departamento: body.departamento,
              fechaAsignacion,
              asignadoPor: body.asignadoPor,
              nota: body.nota,
              detalle: body.detalle,
            }
          : {
              tipo: 'LICENCIA',
              nombreEmpleado: body.nombreEmpleado,
              correoEmpleado: body.correoEmpleado,
              numeroEmpleado: body.numeroEmpleado,
              departamento: body.departamento,
              fechaAsignacion,
              asignadoPor: body.asignadoPor,
              nota: body.nota,
              detalle: body.detalle,
            };

      const command = new SendAssignmentNoticeCommand(payload);
      const result = await sendAssignmentNoticeHandler.handle(command);
      const message =
        result.status === 'SENT'
          ? 'Aviso automático de asignación enviado exitosamente'
          : 'No se pudo enviar el aviso de asignación, pero el flujo principal no fue interrumpido';

      ResponseBuilder.success(res, result, message);
    } catch (error) {
      next(error);
    }
  },

  // Endpoint de verificación rápida: POST /api/notificaciones/prueba
  probarEnvio: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { correoDestino, nombre, tipoPrueba } = req.body as {
        correoDestino: string;
        nombre: string;
        tipoPrueba: 'BIENVENIDA' | 'ASIGNACION_ACTIVO' | 'ASIGNACION_LICENCIA';
      };

      if (tipoPrueba === 'BIENVENIDA') {
        const command = new SendWelcomeEmailCommand(
          nombre,
          correoDestino,
          'EMPLEADO',
          true,
          'EMP-TEST-001',
          'Tecnologías de la Información',
        );
        const result = await sendWelcomeEmailHandler.handle(command);
        ResponseBuilder.success(res, result, 'Prueba de correo de bienvenida (HU03) ejecutada');
        return;
      }

      const payload: AssignmentNoticeData =
        tipoPrueba === 'ASIGNACION_ACTIVO'
          ? {
              tipo: 'ACTIVO',
              nombreEmpleado: nombre,
              correoEmpleado: correoDestino,
              numeroEmpleado: 'EMP-TEST-001',
              departamento: 'Ingeniería',
              fechaAsignacion: new Date(),
              asignadoPor: 'Administrador de TI',
              nota: 'Correo de verificación SMTP para asignación de activo (HU06).',
              detalle: {
                nombreActivo: 'Laptop Corporativa ThinkPad T14',
                etiqueta: 'AST-TEST-001',
                numeroSerie: 'SN-TEST-2026-001',
                categoria: 'Equipo de Cómputo',
                ubicacion: 'Oficina Central - Piso 2',
                marca: 'Lenovo',
                modelo: 'ThinkPad T14 Gen 5',
              },
            }
          : {
              tipo: 'LICENCIA',
              nombreEmpleado: nombre,
              correoEmpleado: correoDestino,
              numeroEmpleado: 'EMP-TEST-001',
              departamento: 'Ingeniería',
              fechaAsignacion: new Date(),
              asignadoPor: 'Administrador de TI',
              nota: 'Correo de verificación SMTP para asignación de licencia (HU06).',
              detalle: {
                software: 'Microsoft 365 E3',
                proveedor: 'Microsoft',
                referenciaContrato: 'CTR-2026-M365',
                inicioVigencia: '2026-01-01',
                finVigencia: '2026-12-31',
              },
            };

      const command = new SendAssignmentNoticeCommand(payload);
      const result = await sendAssignmentNoticeHandler.handle(command);
      ResponseBuilder.success(res, result, 'Prueba de aviso de asignación (HU06) ejecutada');
    } catch (error) {
      next(error);
    }
  },
});

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import { SendWelcomeEmailCommand } from '../../application/notifications/commands/correo-bienvenida/SendWelcomeEmailCommand.js';
import { SendWelcomeEmailHandler } from '../../application/notifications/commands/correo-bienvenida/SendWelcomeEmailHandler.js';
import { SendAssignmentNoticeCommand } from '../../application/notifications/commands/aviso-asignacion/SendAssignmentNoticeCommand.js';
import { SendAssignmentNoticeHandler } from '../../application/notifications/commands/aviso-asignacion/SendAssignmentNoticeHandler.js';
import { MailTemplateRenderer } from '../../infrastructure/services/MailTemplateRenderer.js';
import { notificationControllerFactory } from '../../presentation/controllers/NotificationController.js';
import type { IMailService, MailMessage, MailSendResult } from '../../domain/contracts/index.js';

class InMemoryMailService implements IMailService {
  public sentMessages: MailMessage[] = [];
  public shouldFail = false;

  async verifyConnection(): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error('SMTP connection refused');
    }
    return true;
  }

  async sendMail(message: MailMessage): Promise<MailSendResult> {
    if (this.shouldFail) {
      throw new Error('SMTP network timeout');
    }
    this.sentMessages.push(message);
    return {
      messageId: `<test-${this.sentMessages.length}@assetops.test>`,
      accepted: [message.to],
      rejected: [],
      previewUrl: `https://ethereal.email/message/mock-${this.sentMessages.length}`,
    };
  }
}

describe('Backend de Correo SMTP (HU03 y HU06) - Clean Architecture + CQRS + SOLID', () => {
  let mailService: InMemoryMailService;
  let templateRenderer: MailTemplateRenderer;
  let welcomeHandler: SendWelcomeEmailHandler;
  let assignmentHandler: SendAssignmentNoticeHandler;

  beforeEach(() => {
    mailService = new InMemoryMailService();
    templateRenderer = new MailTemplateRenderer();
    welcomeHandler = new SendWelcomeEmailHandler(mailService, templateRenderer, {
      welcomeEnabledByDefault: true,
    });
    assignmentHandler = new SendAssignmentNoticeHandler(mailService, templateRenderer);
  });

  describe('HU03 — Correo de bienvenida opcional', () => {
    it('debe omitir el envío cuando enviarCorreo es false sin tocar SMTP', async () => {
      const command = new SendWelcomeEmailCommand(
        'Carlos Ruiz',
        'carlos@assetops.test',
        'EMPLEADO',
        false,
      );

      const result = await welcomeHandler.handle(command);

      expect(result.status).toBe('SKIPPED');
      expect(result.sent).toBe(false);
      expect(mailService.sentMessages).toHaveLength(0);
    });

    it('debe omitir el envío cuando la configuración global está desactivada y no se fuerza el parámetro', async () => {
      const disabledHandler = new SendWelcomeEmailHandler(mailService, templateRenderer, {
        welcomeEnabledByDefault: false,
      });

      const result = await disabledHandler.handle(
        new SendWelcomeEmailCommand('Lucía Vega', 'lucia@assetops.test', 'EMPLEADO'),
      );

      expect(result.status).toBe('SKIPPED');
      expect(result.sent).toBe(false);
      expect(mailService.sentMessages).toHaveLength(0);
    });

    it('debe enviar el correo de bienvenida con plantilla HTML y texto plano', async () => {
      const result = await welcomeHandler.handle(
        new SendWelcomeEmailCommand(
          'María Fernanda Gómez',
          'maria@assetops.test',
          'EMPLEADO',
          true,
          'EMP-2026-101',
          'Desarrollo Móvil',
        ),
      );

      expect(result.status).toBe('SENT');
      expect(result.sent).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mailService.sentMessages).toHaveLength(1);
      expect(mailService.sentMessages[0]?.html).toContain('María Fernanda Gómez');
      expect(mailService.sentMessages[0]?.html).toContain('EMP-2026-101');
      expect(mailService.sentMessages[0]?.text).toContain('Desarrollo Móvil');
    });

    it('debe manejar fallos SMTP devolviendo FAILED sin lanzar excepción', async () => {
      mailService.shouldFail = true;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await welcomeHandler.handle(
        new SendWelcomeEmailCommand('Usuario Resiliente', 'error@assetops.test', 'USUARIO', true),
      );

      expect(result.status).toBe('FAILED');
      expect(result.sent).toBe(false);
      expect(result.reason).toContain('SMTP network timeout');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('HU06 — Aviso automático al asignar', () => {
    it('debe enviar aviso HTML con datos relevantes al asignar un ACTIVO y escapar HTML', async () => {
      const result = await assignmentHandler.handle(
        new SendAssignmentNoticeCommand({
          tipo: 'ACTIVO',
          nombreEmpleado: 'Ana <script>alert(1)</script> López',
          correoEmpleado: 'ana@assetops.test',
          numeroEmpleado: 'EMP-009',
          departamento: 'Ingeniería',
          fechaAsignacion: new Date('2026-11-23T18:58:00.000Z'),
          asignadoPor: 'Administrador de TI',
          nota: 'Entrega con cargador original',
          detalle: {
            nombreActivo: 'Laptop Dell Latitude 5450',
            etiqueta: 'AST-LAP-204',
            numeroSerie: 'DL5450-2026-9981',
            categoria: 'Equipo de Cómputo',
            ubicacion: 'Edificio Norte - Piso 2',
            marca: 'Dell',
            modelo: 'Latitude 5450',
          },
        }),
      );

      expect(result.status).toBe('SENT');
      expect(result.sent).toBe(true);
      expect(mailService.sentMessages).toHaveLength(1);
      const sent = mailService.sentMessages[0]!;
      expect(sent.subject).toContain('AST-LAP-204');
      expect(sent.html).toContain('Laptop Dell Latitude 5450');
      expect(sent.html).toContain('DL5450-2026-9981');
      expect(sent.html).not.toContain('<script>');
      expect(sent.html).toContain('&lt;script&gt;');
    });

    it('debe enviar aviso HTML con datos relevantes al asignar una LICENCIA', async () => {
      const result = await assignmentHandler.handle(
        new SendAssignmentNoticeCommand({
          tipo: 'LICENCIA',
          nombreEmpleado: 'María Fernanda Gómez',
          correoEmpleado: 'maria@assetops.test',
          fechaAsignacion: new Date('2026-11-23T18:58:00.000Z'),
          detalle: {
            software: 'JetBrains All Products Pack',
            proveedor: 'JetBrains',
            referenciaContrato: 'JB-2026-CORP-18',
            inicioVigencia: '2026-02-01',
            finVigencia: '2027-01-31',
          },
        }),
      );

      expect(result.status).toBe('SENT');
      expect(result.sent).toBe(true);
      expect(mailService.sentMessages[0]?.html).toContain('JetBrains All Products Pack');
      expect(mailService.sentMessages[0]?.html).toContain('JB-2026-CORP-18');
    });

    it('debe devolver FAILED sin tumbar el flujo principal si falla SMTP al asignar', async () => {
      mailService.shouldFail = true;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await assignmentHandler.handle(
        new SendAssignmentNoticeCommand({
          tipo: 'LICENCIA',
          nombreEmpleado: 'Prueba',
          correoEmpleado: 'prueba@assetops.test',
          fechaAsignacion: new Date(),
          detalle: { software: 'Figma' },
        }),
      );

      expect(result.status).toBe('FAILED');
      expect(result.sent).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe('Capa de Presentación — NotificationController', () => {
    it('debe responder HTTP 200 al procesar enviarBienvenida', async () => {
      const controller = notificationControllerFactory({
        sendWelcomeEmailHandler: welcomeHandler,
        sendAssignmentNoticeHandler: assignmentHandler,
      });

      const req = {
        body: {
          nombre: 'Empleado Demo',
          correo: 'demo@assetops.test',
          tipoDestinatario: 'EMPLEADO',
          enviarCorreo: true,
        },
      } as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      await controller.enviarBienvenida(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            status: 'SENT',
            sent: true,
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});

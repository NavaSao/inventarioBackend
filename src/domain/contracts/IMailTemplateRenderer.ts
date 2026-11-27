import type { AssignmentNoticeData, RenderedEmailTemplate, WelcomeEmailData } from './mail.js';

/**
 * Puerto de renderizado de plantillas HTML y texto plano para notificaciones.
 */
export interface IMailTemplateRenderer {
  renderWelcomeEmail(data: WelcomeEmailData): RenderedEmailTemplate;
  renderAssignmentNoticeEmail(data: AssignmentNoticeData): RenderedEmailTemplate;
}

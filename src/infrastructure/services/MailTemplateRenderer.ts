import type {
  AssignmentNoticeData,
  IMailTemplateRenderer,
  RenderedEmailTemplate,
  WelcomeEmailData,
} from '../../domain/contracts/mail.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function buildRow(label: string, value?: string): string {
  if (!value) return '';
  return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600; width: 40%;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function wrapLayout(title: string, badge: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
      <tr>
        <td style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #2563eb; color: #ffffff; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.4px;">
            ${escapeHtml(badge)}
          </span>
          <h1 style="margin: 12px 0 0 0; font-size: 20px; line-height: 1.3; font-weight: 700;">
            ${escapeHtml(title)}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Este es un correo automático generado por <strong>AssetOps</strong>. Por favor, no respondas directamente a este mensaje.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Servicio de renderizado de plantillas HTML y texto plano para HU03 y HU06.
 * Responsabilidad única (SRP): formateo seguro de mensajes sin lógica de transporte SMTP.
 */
export class MailTemplateRenderer implements IMailTemplateRenderer {
  renderWelcomeEmail(data: WelcomeEmailData): RenderedEmailTemplate {
    const rolLegible = data.tipoDestinatario === 'USUARIO' ? 'Administrador de TI' : 'Empleado';
    const subject = `Bienvenido(a) a AssetOps, ${data.nombre}`;

    const detailsRows = [
      buildRow('Nombre completo', data.nombre),
      buildRow('Correo registrado', data.correo),
      buildRow('Perfil', rolLegible),
      buildRow('Número de empleado', data.numeroEmpleado),
      buildRow('Departamento', data.departamento),
    ]
      .filter(Boolean)
      .join('');

    const bodyHtml = `
      <p style="margin-top: 0;">Hola <strong>${escapeHtml(data.nombre)}</strong>,</p>
      <p>
        Te damos la bienvenida a <strong>AssetOps</strong>. Tu registro como
        <strong>${escapeHtml(rolLegible)}</strong> ha sido completado exitosamente en el sistema de gestión de inventario de TI.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px;">
        ${detailsRows}
      </table>
      <p style="margin-bottom: 0;">
        A partir de ahora recibirás notificaciones automáticas cada vez que el equipo de TI registre asignaciones de activos o licencias asociadas a tu cuenta.
      </p>
    `;

    const textLines = [
      `Hola ${data.nombre},`,
      '',
      `Te damos la bienvenida a AssetOps. Tu registro como ${rolLegible} ha sido completado exitosamente.`,
      '',
      `Nombre completo: ${data.nombre}`,
      `Correo registrado: ${data.correo}`,
      `Perfil: ${rolLegible}`,
      ...(data.numeroEmpleado ? [`Número de empleado: ${data.numeroEmpleado}`] : []),
      ...(data.departamento ? [`Departamento: ${data.departamento}`] : []),
      '',
      'Recibirás notificaciones automáticas cuando se te asignen activos o licencias de software.',
      '-- AssetOps TI',
    ];

    return {
      subject,
      html: wrapLayout('Bienvenido(a) a AssetOps', 'ALTA DE REGISTRO', bodyHtml),
      text: textLines.join('\n'),
    };
  }

  renderAssignmentNoticeEmail(data: AssignmentNoticeData): RenderedEmailTemplate {
    const fechaFormateada = formatDate(data.fechaAsignacion);

    if (data.tipo === 'ACTIVO') {
      const { detalle } = data;
      const subject = `Asignación de activo: ${detalle.nombreActivo} (${detalle.etiqueta})`;

      const rows = [
        buildRow('Tipo de asignación', 'Activo de TI'),
        buildRow('Activo', detalle.nombreActivo),
        buildRow('Etiqueta', detalle.etiqueta),
        buildRow('Número de serie', detalle.numeroSerie),
        buildRow('Categoría', detalle.categoria),
        buildRow('Ubicación', detalle.ubicacion),
        buildRow('Marca', detalle.marca),
        buildRow('Modelo', detalle.modelo),
        buildRow('Empleado', data.nombreEmpleado),
        buildRow('Número de empleado', data.numeroEmpleado),
        buildRow('Departamento', data.departamento),
        buildRow('Fecha de entrega', fechaFormateada),
        buildRow('Entregado por', data.asignadoPor),
        buildRow('Nota de entrega', data.nota),
      ]
        .filter(Boolean)
        .join('');

      const bodyHtml = `
        <p style="margin-top: 0;">Hola <strong>${escapeHtml(data.nombreEmpleado)}</strong>,</p>
        <p>
          Se ha registrado la asignación del siguiente <strong>activo de TI</strong> a tu cargo en <strong>AssetOps</strong>:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px;">
          ${rows}
        </table>
        <p style="margin-bottom: 0;">
          Por favor verifica que los datos coincidan con el equipo recibido. Si detectas alguna inconsistencia, comunícate con el área de TI.
        </p>
      `;

      const textLines = [
        `Hola ${data.nombreEmpleado},`,
        '',
        'Se ha registrado la asignación de un activo de TI a tu cargo en AssetOps:',
        `Activo: ${detalle.nombreActivo}`,
        `Etiqueta: ${detalle.etiqueta}`,
        `Número de serie: ${detalle.numeroSerie}`,
        `Categoría: ${detalle.categoria}`,
        `Ubicación: ${detalle.ubicacion}`,
        ...(detalle.marca ? [`Marca: ${detalle.marca}`] : []),
        ...(detalle.modelo ? [`Modelo: ${detalle.modelo}`] : []),
        ...(data.numeroEmpleado ? [`Número de empleado: ${data.numeroEmpleado}`] : []),
        ...(data.departamento ? [`Departamento: ${data.departamento}`] : []),
        `Fecha de entrega: ${fechaFormateada}`,
        ...(data.asignadoPor ? [`Entregado por: ${data.asignadoPor}`] : []),
        ...(data.nota ? [`Nota de entrega: ${data.nota}`] : []),
        '',
        '-- AssetOps TI',
      ];

      return {
        subject,
        html: wrapLayout('Aviso de Asignación de Activo', 'ASIGNACIÓN DE ACTIVO', bodyHtml),
        text: textLines.join('\n'),
      };
    }

    const { detalle } = data;
    const subject = `Asignación de licencia: ${detalle.software}`;

    const rows = [
      buildRow('Tipo de asignación', 'Licencia de Software'),
      buildRow('Software', detalle.software),
      buildRow('Proveedor', detalle.proveedor),
      buildRow('Referencia de contrato', detalle.referenciaContrato),
      buildRow('Inicio de vigencia', detalle.inicioVigencia),
      buildRow('Fin de vigencia', detalle.finVigencia),
      buildRow('Empleado', data.nombreEmpleado),
      buildRow('Número de empleado', data.numeroEmpleado),
      buildRow('Departamento', data.departamento),
      buildRow('Fecha de asignación', fechaFormateada),
      buildRow('Asignado por', data.asignadoPor),
      buildRow('Nota', data.nota),
    ]
      .filter(Boolean)
      .join('');

    const bodyHtml = `
      <p style="margin-top: 0;">Hola <strong>${escapeHtml(data.nombreEmpleado)}</strong>,</p>
      <p>
        Se te ha asignado un cupo de la siguiente <strong>licencia de software</strong> en <strong>AssetOps</strong>:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 18px 0; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px;">
        ${rows}
      </table>
      <p style="margin-bottom: 0;">
        Si necesitas apoyo con la activación o acceso a esta licencia, contacta al equipo de TI.
      </p>
    `;

    const textLines = [
      `Hola ${data.nombreEmpleado},`,
      '',
      'Se te ha asignado una licencia de software en AssetOps:',
      `Software: ${detalle.software}`,
      ...(detalle.proveedor ? [`Proveedor: ${detalle.proveedor}`] : []),
      ...(detalle.referenciaContrato ? [`Referencia de contrato: ${detalle.referenciaContrato}`] : []),
      ...(detalle.inicioVigencia ? [`Inicio de vigencia: ${detalle.inicioVigencia}`] : []),
      ...(detalle.finVigencia ? [`Fin de vigencia: ${detalle.finVigencia}`] : []),
      ...(data.numeroEmpleado ? [`Número de empleado: ${data.numeroEmpleado}`] : []),
      ...(data.departamento ? [`Departamento: ${data.departamento}`] : []),
      `Fecha de asignación: ${fechaFormateada}`,
      ...(data.asignadoPor ? [`Asignado por: ${data.asignadoPor}`] : []),
      ...(data.nota ? [`Nota: ${data.nota}`] : []),
      '',
      '-- AssetOps TI',
    ];

    return {
      subject,
      html: wrapLayout('Aviso de Asignación de Licencia', 'ASIGNACIÓN DE LICENCIA', bodyHtml),
      text: textLines.join('\n'),
    };
  }
}

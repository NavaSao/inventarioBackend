import { describe, expect, it } from '@jest/globals';
import { ConsultarLicenciaHandler } from '../../application/queries/licencias/LicenciaHandlers.js';
import { diaDeConsulta, resumirLicencia, type Licencia } from '../../domain/models/Licencia.js';
import { registroLicenciaSchema } from '../../presentation/validators/licenciaValidator.js';

const datos = {
  codigoLicencia: ' fig-org-2026 ',
  software: 'Figma',
  plan: 'Organization',
  periodicidad: 'Anual',
  inicioVigencia: '2026-01-01',
  finVigencia: '2026-12-22',
  cuposContratados: 4,
};

const licencia: Licencia = {
  idLicencia: 'be7648ae-c038-4b69-a9b4-a06eaa61d3b1',
  ...registroLicenciaSchema.parse(datos),
};

describe('HU05 - Catálogo de licencias', () => {
  it('acepta el alta del catálogo, normaliza el código y permite omitir el costo', () => {
    expect(registroLicenciaSchema.parse(datos)).toMatchObject({
      codigoLicencia: 'FIG-ORG-2026',
      plan: 'Organization',
      periodicidad: 'Anual',
      costo: null,
      moneda: null,
    });
  });

  it.each([
    { cuposContratados: 0 },
    { inicioVigencia: '2027-01-01' },
    { finVigencia: '2026-02-30' },
    { plan: '' },
    { costo: '12.75' },
  ])('rechaza datos inválidos: %j', (cambio) => {
    expect(registroLicenciaSchema.safeParse({ ...datos, ...cambio }).success).toBe(false);
  });

  it.each([
    ['2026-11-22', 'VENCIDA', 0],
    ['2026-12-21', 'POR_VENCER', 3],
    ['2026-12-22', 'VIGENTE', 3],
  ])('muestra la vigencia y los cupos de un contrato que vence el %s', (fin, estado, cuposAsignables) => {
    const hoy = diaDeConsulta(new Date('2026-11-22T20:00:00Z'));
    const contrato = { ...licencia, finVigencia: new Date(fin) };

    expect(resumirLicencia(contrato, 1, hoy)).toMatchObject({
      estado, cuposAsignables, finVigencia: fin, cuposLibres: 3, porcentajeOcupacion: 25,
    });
  });

  it('calcula el día en la zona del proyecto y no permite ofrecer cupos de un contrato futuro', () => {
    const hoy = diaDeConsulta(new Date('2026-11-23T03:00:00Z'));
    expect(hoy.toISOString()).toBe('2026-11-22T00:00:00.000Z');
    expect(resumirLicencia({ ...licencia, inicioVigencia: new Date('2026-11-23') }, 0, hoy).cuposAsignables).toBe(0);
  });

  it('responde con un 404 si el contrato no existe', async () => {
    const handler = new ConsultarLicenciaHandler({
      listar: async () => [],
      consultar: async () => null,
    });
    await expect(handler.handle(licencia.idLicencia)).rejects.toMatchObject({ statusCode: 404 });
  });
});

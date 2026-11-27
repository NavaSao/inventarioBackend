import { z } from 'zod';

const texto = z.string().trim().min(1).max(120);
const textoOpcional = z.string().trim().max(120).nullish().transform((valor) => valor || null);
const fecha = z.iso.date().transform((valor) => new Date(`${valor}T00:00:00Z`));
const costo = z.union([z.string().trim(), z.number().transform(String)])
  .pipe(z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'El costo debe ser positivo o cero, con hasta dos decimales'))
  .nullish().transform((valor) => valor ?? null);

export const registroLicenciaSchema = z.object({
  codigoLicencia: texto.toUpperCase(),
  software: texto,
  plan: texto,
  periodicidad: texto,
  proveedor: textoOpcional,
  referenciaContrato: textoOpcional,
  inicioVigencia: fecha,
  finVigencia: fecha,
  cuposContratados: z.int32().min(1),
  costo,
  moneda: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullish().transform((valor) => valor ?? null),
})
  .refine((datos) => datos.finVigencia >= datos.inicioVigencia, {
    path: ['finVigencia'], message: 'El fin de vigencia no puede ser anterior al inicio',
  })
  .refine((datos) => (datos.costo === null) === (datos.moneda === null), {
    path: ['moneda'], message: 'Indica costo y moneda juntos',
  });

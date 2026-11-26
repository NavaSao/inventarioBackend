export const EstadoActivo = {
  DISPONIBLE: 'DISPONIBLE',
  ASIGNADO: 'ASIGNADO',
  EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
  DADO_DE_BAJA: 'DADO_DE_BAJA',
} as const;

export type EstadoActivo = (typeof EstadoActivo)[keyof typeof EstadoActivo];

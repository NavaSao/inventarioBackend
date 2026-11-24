export type EstadoLicencia = 'VIGENTE' | 'POR_VENCER' | 'VENCIDA';
export const DIAS_AVISO_VENCIMIENTO = 30;

export interface DatosLicencia {
  codigoLicencia: string;
  software: string;
  plan: string | null;
  periodicidad: string | null;
  proveedor: string | null;
  referenciaContrato: string | null;
  inicioVigencia: Date;
  finVigencia: Date;
  cuposContratados: number;
  costo: string | null;
  moneda: string | null;
}

export interface Licencia extends DatosLicencia {
  idLicencia: string;
}

export interface CupoAsignado {
  idAsignacionLicencia: string;
  asignadoEn: Date;
  empleado: {
    idEmpleado: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
  };
}

export interface MovimientoLicenciaHistorial {
  idAsignacionLicencia: string;
  estado: 'ACTIVA' | 'LIBERADA';
  asignadoEn: Date;
  liberadoEn: Date | null;
  claveAsignacion: string;
  claveLiberacion: string | null;
  nota: string | null;
  empleado: {
    idEmpleado: string;
    numeroEmpleado: string;
    nombre: string;
    correo: string;
    departamento: string | null;
    activo: boolean;
  };
  asignadoPor: {
    idUsuario: string;
    nombre: string;
  };
  liberadoPor: {
    idUsuario: string;
    nombre: string;
  } | null;
}

const fechaLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' });
const unDia = 86_400_000;

// Prisma representa las columnas DATE en UTC. Convierto el día local al mismo formato.
export function diaDeConsulta(ahora = new Date()): Date {
  return new Date(`${fechaLocal.format(ahora)}T00:00:00Z`);
}

export function resumirLicencia(licencia: Licencia, cuposAsignados: number, hoy: Date) {
  const diasParaVencer = (licencia.finVigencia.getTime() - hoy.getTime()) / unDia;
  const estado: EstadoLicencia = diasParaVencer <= 0
    ? 'VENCIDA'
    : diasParaVencer < DIAS_AVISO_VENCIMIENTO ? 'POR_VENCER' : 'VIGENTE';
  const cuposLibres = Math.max(licencia.cuposContratados - cuposAsignados, 0);

  return {
    ...licencia,
    inicioVigencia: licencia.inicioVigencia.toISOString().slice(0, 10),
    finVigencia: licencia.finVigencia.toISOString().slice(0, 10),
    estado,
    diasParaVencer,
    cuposAsignados,
    cuposLibres,
    cuposAsignables: estado !== 'VENCIDA' && licencia.inicioVigencia <= hoy ? cuposLibres : 0,
    porcentajeOcupacion: Math.round(cuposAsignados * 100 / licencia.cuposContratados),
  };
}

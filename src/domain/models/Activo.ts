import type { EstadoActivo } from '../enums/EstadoActivo.js';

export interface Activo {
  idActivo: string;
  nombre: string;
  numeroSerie: string;
  etiqueta: string;
  categoria: string;
  ubicacion: string;
  marca?: string | null;
  modelo?: string | null;
  estado: EstadoActivo;
  fotoReferencia?: string | null;
  fechaBaja?: Date | null;
  motivoBaja?: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

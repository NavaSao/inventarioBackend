import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IFotoStorage } from '../../domain/contracts/activos.js';

export const DIRECTORIO_UPLOADS = path.resolve('uploads');

/** Guarda las fotos en disco (uploads/activos) y las expone en /uploads/activos. */
export class LocalFotoStorage implements IFotoStorage {
  async guardar(nombre: string, contenido: Buffer): Promise<string> {
    const carpeta = path.join(DIRECTORIO_UPLOADS, 'activos');
    await mkdir(carpeta, { recursive: true });
    await writeFile(path.join(carpeta, nombre), contenido);
    return `/uploads/activos/${nombre}`;
  }
}

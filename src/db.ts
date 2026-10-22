import Dexie, { Table } from 'dexie';

export interface Garment {
  id?: number;
  type: string;       // Ej: 'Arriba interior', 'Zapatos', 'Accesorios', etc.
  occasion: string;   // Ej: 'TRABAJO', 'SALIDA', 'FINDE'
  minTemp: number;
  maxTemp: number;
  imageUrl: string;
  createdAt: Date;
}

export interface CustomConfig {
  id?: number;
  key: string;        // 'types' o 'occasions'
  values: string[];
}

export class ArmarioDatabase extends Dexie {
  garments!: Table<Garment>;
  configs!: Table<CustomConfig>;

  constructor() {
    super('ArmarioPWA');
    this.version(1).stores({
      garments: '++id, type, occasion, minTemp, maxTemp',
      configs: '++id, key'
    });
  }
}

export const db = new ArmarioDatabase();

// Tipos por defecto en el orden estricto solicitado
export const DEFAULT_TYPES = [
  'Arriba exterior',
  'Arriba interior',
  'Abajo',
  'Zapatos',
  'Abrigo',
  'Accesorios',
  'Entero'
];

export const DEFAULT_OCCASIONS = ['TRABAJO', 'SALIDA', 'FINDE'];

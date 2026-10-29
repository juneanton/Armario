import Dexie, { Table } from 'dexie';

export interface Garment {
  id?: number;
  type: string;
  occasion: string;
  minTemp: number;
  maxTemp: number;
  imageUrl: string;
  createdAt: Date;
}

export interface Look {
  id?: number;
  name: string;
  items: Garment[];
  createdAt: Date;
}

export interface Uso {
  id?: number;
  lookId: number;
  lookName: string;
  date: string;
}

export interface CustomConfig {
  id?: number;
  key: string; // 'types' o 'occasions'
  values: string[];
}

export class ArmarioDatabase extends Dexie {
  garments!: Table<Garment>;
  looks!: Table<Look>;
  usos!: Table<Uso>;
  configs!: Table<CustomConfig>;

  constructor() {
    super('ArmarioPWA');
    this.version(1).stores({
      garments: '++id, type, occasion, minTemp, maxTemp',
      looks: '++id, name, createdAt',
      usos: '++id, lookId, date',
      configs: '++id, key'
    });
  }
}

export const db = new ArmarioDatabase();

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

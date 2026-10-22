// IndexedDB implementation with dynamic options (Tipos and Ocasiones)
const DB_NAME = 'ArmarioDB';
const DB_VERSION = 2;

export interface Prenda {
  id: string;
  fotoBlob?: Blob;
  fotoBase64?: string;
  nombre: string;
  tipo: string;
  parte: 'Arriba interior' | 'Arriba exterior' | 'Abajo' | 'Abrigo' | 'Accesorios' | 'Zapatos' | 'Entero';
  color: string;
  tela: string;
  clima: string[];
  ocasiones: string[];
  vecesUsada: number;
  ultimoUso?: string;
  fechaAlta: string;
}

export interface Look {
  id: string;
  prendasIds: string[];
  ocasion: string;
  nota: string;
  fecha: string;
  favorito: boolean;
}

export interface Uso {
  id?: number;
  fecha: string;
  lookId: string;
  prendasIds: string[];
}

export interface ConfigOp {
  key: 'tipos' | 'ocasiones';
  values: string[];
}

const DEFAULT_TIPOS = ['remera', 'camisa', 'blusa', 'pantalón', 'pollera', 'vestido', 'abrigo', 'calzado', 'accesorio', 'top', 'campera', 'suéter'];
const DEFAULT_OCASIONES = ['Trabajo', 'Salida', 'Finde', 'Casa'];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('prendas')) {
        db.createObjectStore('prendas', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('looks')) {
        db.createObjectStore('looks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('usos')) {
        db.createObjectStore('usos', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getPrendas(): Promise<Prenda[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('prendas', 'readonly');
    const store = tx.objectStore('prendas');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePrenda(prenda: Prenda): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('prendas', 'readwrite');
    const store = tx.objectStore('prendas');
    const req = store.put(prenda);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePrenda(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('prendas', 'readwrite');
    const store = tx.objectStore('prendas');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLooks(): Promise<Look[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('looks', 'readonly');
    const store = tx.objectStore('looks');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLook(look: Look): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('looks', 'readwrite');
    const store = tx.objectStore('looks');
    const req = store.put(look);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLook(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('looks', 'readwrite');
    const store = tx.objectStore('looks');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getUsos(): Promise<Uso[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('usos', 'readonly');
    const store = tx.objectStore('usos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function registrarUso(lookId: string, prendasIds: string[]): Promise<void> {
  const db = await openDB();
  const fechaHoy = new Date().toISOString().split('T')[0];
  
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('usos', 'readwrite');
    const store = tx.objectStore('usos');
    const req = store.add({ fecha: fechaHoy, lookId, prendasIds });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const prendas = await getPrendas();
  for (const pId of prendasIds) {
    const p = prendas.find(item => item.id === pId);
    if (p) {
      p.vecesUsada = (p.vecesUsada || 0) + 1;
      p.ultimoUso = fechaHoy;
      await savePrenda(p);
    }
  }
}

// Config Tipos & Ocasiones
export async function getCustomList(key: 'tipos' | 'ocasiones'): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('config', 'readonly');
    const store = tx.objectStore('config');
    const req = store.get(key);
    req.onsuccess = () => {
      if (req.result && req.result.values) {
        resolve(req.result.values);
      } else {
        resolve(key === 'tipos' ? DEFAULT_TIPOS : DEFAULT_OCASIONES);
      }
    };
    req.onerror = () => resolve(key === 'tipos' ? DEFAULT_TIPOS : DEFAULT_OCASIONES);
  });
}

export async function saveCustomList(key: 'tipos' | 'ocasiones', values: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    const req = store.put({ key, values });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  const stores = ['prendas', 'looks', 'usos', 'config'];
  for (const s of stores) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(s, 'readwrite');
      const store = tx.objectStore(s);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

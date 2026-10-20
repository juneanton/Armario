// Simple, robust IndexedDB implementation without external heavy library issues
const DB_NAME = 'ArmarioDB';
const DB_VERSION = 1;

export interface Prenda {
  id: string;
  fotoBlob?: Blob;
  fotoBase64?: string;
  nombre: string;
  tipo: string;
  parte: 'Arriba' | 'Abajo' | 'Entero' | 'Abrigo';
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
  
  // Save uso record
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('usos', 'readwrite');
    const store = tx.objectStore('usos');
    const req = store.add({ fecha: fechaHoy, lookId, prendasIds });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Update prendas usage counts
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

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  const stores = ['prendas', 'looks', 'usos'];
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

/**
 * Rôle : accès bas niveau à IndexedDB (base PodcastStudioDB, magasins recordings et episodes).
 * Exemple : await put('recordings', { id: '1', created: new Date().toISOString(), audio: blob });
 */
export const DB_NAME = 'PodcastStudioDB';
export const DB_VERSION = 2;
export const STORES = Object.freeze({ recordings: 'recordings', episodes: 'episodes' });

let dbPromise = null;

function upgrade(db) {
  for (const name of Object.values(STORES)) {
    if (db.objectStoreNames.contains(name)) continue;
    const store = db.createObjectStore(name, { keyPath: 'id' });
    store.createIndex('created', 'created', { unique: false });
  }
}

export function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => upgrade(request.result);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

export async function closeDB() {
  if (!dbPromise) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(storeName, mode, action) {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  const result = await wrap(action(tx.objectStore(storeName)));
  await done;
  return result;
}

export const put = (store, item) => run(store, 'readwrite', (s) => s.put(item));
export const get = (store, id) => run(store, 'readonly', (s) => s.get(id));
export const getAll = (store) => run(store, 'readonly', (s) => s.getAll());
export const remove = (store, id) => run(store, 'readwrite', (s) => s.delete(id));
export const clear = (store) => run(store, 'readwrite', (s) => s.clear());

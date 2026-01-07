/**
 * Database Module
 * Wraps IndexedDB operations for Audio Files and Metadata.
 */

const DB_NAME = 'PodcastStudioDB';
const DB_VERSION = 2; // Incremented for schema change
const STORE_EPISODES = 'episodes';
const STORE_RECORDINGS = 'recordings';

let dbInstance = null;

export async function initDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database Error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Episodes Store (Final Mixes)
            if (!db.objectStoreNames.contains(STORE_EPISODES)) {
                const store = db.createObjectStore(STORE_EPISODES, { keyPath: 'id' });
                store.createIndex('created', 'created', { unique: false });
            }

            // Recordings Store (Raw Audio)
            if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
                const store = db.createObjectStore(STORE_RECORDINGS, { keyPath: 'id' });
                store.createIndex('created', 'created', { unique: false });
            }
        };
    });
}

// Generic Save
export async function saveItem(storeName, metadata, blob) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const item = {
            id: Date.now().toString(),
            created: new Date().toISOString(),
            ...metadata,
            audio: blob
        };

        const request = store.add(item);
        request.onsuccess = () => resolve(item.id);
        request.onerror = (e) => reject(e.target.error);
    });
}

export async function saveEpisode(metadata, blob) {
    return saveItem(STORE_EPISODES, metadata, blob);
}

export async function saveRecording(metadata, blob) {
    return saveItem(STORE_RECORDINGS, metadata, blob);
}

// Generic Get All
export async function getAllItems(storeName) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by newest first
            const results = request.result || [];
            results.sort((a, b) => new Date(b.created) - new Date(a.created));
            resolve(results);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

export async function getAllEpisodes() {
    return getAllItems(STORE_EPISODES);
}

export async function getAllRecordings() {
    return getAllItems(STORE_RECORDINGS);
}

// Generic Delete
export async function deleteItem(storeName, id) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

export async function deleteEpisode(id) {
    return deleteItem(STORE_EPISODES, id);
}

export async function deleteRecording(id) {
    return deleteItem(STORE_RECORDINGS, id);
}

export async function clearAllData() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_EPISODES, STORE_RECORDINGS], 'readwrite');

        transaction.objectStore(STORE_EPISODES).clear();
        transaction.objectStore(STORE_RECORDINGS).clear();

        transaction.oncomplete = () => {
            localStorage.clear();
            resolve();
        };
        transaction.onerror = (e) => reject(e.target.error);
    });
}

// Update item metadata
export async function updateItem(storeName, id, newMetadata) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (!data) {
                reject(new Error('Item not found'));
                return;
            }

            const updatedData = { ...data, ...newMetadata };
            const putRequest = store.put(updatedData);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = (e) => reject(e.target.error);
        };
        getRequest.onerror = (e) => reject(e.target.error);
    });
}

export async function updateRecordingTitle(id, newTitle) {
    return updateItem(STORE_RECORDINGS, id, { title: newTitle });
}

export async function getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
        return await navigator.storage.estimate();
    }
    return { usage: 0, quota: 0 };
}

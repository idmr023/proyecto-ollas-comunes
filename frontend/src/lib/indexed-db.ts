const DB_NAME = 'ollas-comunes-db';
const DB_VERSION = 2;

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value;
  const message = (value as { message?: string } | null)?.message;
  return new Error(message || fallback);
}

export interface OfflineMutation {
  id?: number;
  path: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: any;
  timestamp: number;
  tempId?: string;
}

export interface FailedMutation {
  id?: number;
  path: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: any;
  timestamp: number;
  originalTimestamp: number;
  errorMessage: string;
  status?: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB no está disponible en el servidor (SSR).'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('No se pudo abrir la base de datos IndexedDB.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('failed_mutations')) {
        db.createObjectStore('failed_mutations', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// ─── CACHE GET METHODS ──────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as T) || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB Cache] Error al leer:', err);
    return null;
  }
}

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.warn('[IndexedDB Cache] Error al guardar:', err);
  }
}

// ─── OFFLINE MUTATIONS METHODS ──────────────────────────────────

export async function addMutation(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: any,
  tempId?: string
): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      const mutation: Omit<OfflineMutation, 'id'> = {
        path,
        method,
        body,
        timestamp: Date.now(),
        tempId,
      };
      const request = store.add(mutation);

      request.onsuccess = () => {
        resolve(request.result as number);
      };
      request.onerror = () => {
        reject(toError(request.error, 'IndexedDB error'));
      };
    });
  } catch (err) {
    console.error('[IndexedDB Mutations] Error al encolar:', err);
    throw err;
  }
}

export async function getMutations(): Promise<OfflineMutation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('mutations', 'readonly');
      const store = transaction.objectStore('mutations');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB Mutations] Error al leer cola:', err);
    return [];
  }
}

export async function deleteMutation(id: number): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.error('[IndexedDB Mutations] Error al eliminar mutation:', err);
  }
}

export async function updateMutation(mutation: OfflineMutation): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      const request = store.put(mutation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.error('[IndexedDB Mutations] Error al actualizar mutation:', err);
  }
}

export async function clearCache(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.warn('[IndexedDB Cache] Error al limpiar:', err);
  }
}

// ─── FAILED MUTATIONS METHODS ────────────────────────────────────

export async function getFailedMutations(): Promise<FailedMutation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction('failed_mutations', 'readonly');
      const store = transaction.objectStore('failed_mutations');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB Failed Mutations] Error al leer cola:', err);
    return [];
  }
}

export async function addFailedMutation(
  mutation: OfflineMutation,
  errorMessage: string,
  status?: number
): Promise<number> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('failed_mutations', 'readwrite');
      const store = transaction.objectStore('failed_mutations');
      const failedRecord: Omit<FailedMutation, 'id'> = {
        path: mutation.path,
        method: mutation.method,
        body: mutation.body,
        originalTimestamp: mutation.timestamp,
        timestamp: Date.now(),
        errorMessage,
        status,
      };
      const request = store.add(failedRecord);

      request.onsuccess = () => {
        resolve(request.result as number);
      };
      request.onerror = () => {
        reject(toError(request.error, 'IndexedDB error'));
      };
    });
  } catch (err) {
    console.error('[IndexedDB Failed Mutations] Error al registrar fallo:', err);
    throw err;
  }
}

export async function deleteFailedMutation(id: number): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('failed_mutations', 'readwrite');
      const store = transaction.objectStore('failed_mutations');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.error('[IndexedDB Failed Mutations] Error al eliminar fallo:', err);
  }
}

export async function clearFailedMutations(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('failed_mutations', 'readwrite');
      const store = transaction.objectStore('failed_mutations');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(toError(request.error, 'IndexedDB error'));
    });
  } catch (err) {
    console.warn('[IndexedDB Failed Mutations] Error al limpiar:', err);
  }
}

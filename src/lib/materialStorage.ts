/**
 * 학습 자료 로컬 저장소 (IndexedDB + localStorage)
 * 백엔드 API 연동 전까지 클라이언트에서 파일 저장
 */

const DB_NAME = 'blaybus-materials';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const META_KEY = 'materials-meta';

export interface MaterialMeta {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'image' | 'document' | 'other';
  subject: string;
  subCategory: string;
  uploadedAt: string;
}

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveMaterial(meta: MaterialMeta, file: File): Promise<void> {
  const database = await openDB();
  const blob = await file.arrayBuffer();
  
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: meta.id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const metaList = getMaterialsMeta();
  metaList.unshift(meta);
  localStorage.setItem(META_KEY, JSON.stringify(metaList));
}

export function getMaterialsMeta(): MaterialMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getMaterialBlob(id: string): Promise<Blob | null> {
  const database = await openDB();
  return new Promise((resolve) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const row = req.result;
      resolve(row?.blob ? new Blob([row.blob]) : null);
    };
    req.onerror = () => resolve(null);
  });
}

export function deleteMaterial(id: string): Promise<void> {
  return openDB().then((database) => {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        const metaList = getMaterialsMeta().filter((m) => m.id !== id);
        localStorage.setItem(META_KEY, JSON.stringify(metaList));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  });
}

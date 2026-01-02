// IndexedDB storage for encrypted files


import { deriveKey, encryptBlob, decryptBlob } from './crypto';

const DB_NAME = 'HyperDropStorage';
const DB_VERSION = 1;
const FILES_STORE = 'encryptedFiles';
const PEERS_STORE = 'peerSessions';

interface StoredFile {
    id: string;
    name: string;
    size: number;
    type: string;
    encrypted: ArrayBuffer;
    iv: Uint8Array;
    peerId: string;
    peerName: string;
    direction: 'sent' | 'received';
    timestamp: number;
}

export interface PeerSession {
    peerId: string;
    peerName: string;
    lastConnected: number;
    filesCount: number;
}

export interface FileRecord {
    id: string;
    name: string;
    size: number;
    type: string;
    peerId: string;
    peerName: string;
    direction: 'sent' | 'received';
    timestamp: number;
}

let db: IDBDatabase | null = null;
let encryptionKey: CryptoKey | null = null;

// Initialize the database
export async function initStorage(deviceId: string): Promise<void> {
    encryptionKey = await deriveKey(deviceId);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Files store
            if (!database.objectStoreNames.contains(FILES_STORE)) {
                const filesStore = database.createObjectStore(FILES_STORE, { keyPath: 'id' });
                filesStore.createIndex('peerId', 'peerId', { unique: false });
                filesStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Peers store
            if (!database.objectStoreNames.contains(PEERS_STORE)) {
                database.createObjectStore(PEERS_STORE, { keyPath: 'peerId' });
            }
        };
    });
}

// Store an encrypted file
export async function storeFile(
    file: Blob,
    metadata: {
        id: string;
        name: string;
        peerId: string;
        peerName: string;
        direction: 'sent' | 'received';
    }
): Promise<void> {
    if (!db || !encryptionKey) throw new Error('Storage not initialized');

    const { encrypted, iv } = await encryptBlob(file, encryptionKey);

    const storedFile: StoredFile = {
        id: metadata.id,
        name: metadata.name,
        size: file.size,
        type: file.type,
        encrypted,
        iv,
        peerId: metadata.peerId,
        peerName: metadata.peerName,
        direction: metadata.direction,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([FILES_STORE, PEERS_STORE], 'readwrite');

        // Store file
        const filesStore = transaction.objectStore(FILES_STORE);
        filesStore.put(storedFile);

        // Update peer session
        const peersStore = transaction.objectStore(PEERS_STORE);
        const peerRequest = peersStore.get(metadata.peerId);

        peerRequest.onsuccess = () => {
            const existing = peerRequest.result as PeerSession | undefined;
            const updated: PeerSession = {
                peerId: metadata.peerId,
                peerName: metadata.peerName,
                lastConnected: Date.now(),
                filesCount: (existing?.filesCount || 0) + 1,
            };
            peersStore.put(updated);
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Retrieve and decrypt a file
export async function retrieveFile(fileId: string): Promise<Blob | null> {
    if (!db || !encryptionKey) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(FILES_STORE, 'readonly');
        const store = transaction.objectStore(FILES_STORE);
        const request = store.get(fileId);

        request.onsuccess = async () => {
            const stored = request.result as StoredFile | undefined;
            if (!stored) {
                resolve(null);
                return;
            }

            try {
                const blob = await decryptBlob(
                    stored.encrypted,
                    stored.iv,
                    stored.type,
                    encryptionKey!
                );
                resolve(blob);
            } catch (e) {
                reject(e);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

// Get all peer sessions
export async function getPeerSessions(): Promise<PeerSession[]> {
    if (!db) return [];

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(PEERS_STORE, 'readonly');
        const store = transaction.objectStore(PEERS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const sessions = request.result as PeerSession[];
            // Sort by last connected
            sessions.sort((a, b) => b.lastConnected - a.lastConnected);
            resolve(sessions);
        };

        request.onerror = () => reject(request.error);
    });
}

// Get files for a peer
export async function getFilesForPeer(peerId: string): Promise<FileRecord[]> {
    if (!db) return [];

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(FILES_STORE, 'readonly');
        const store = transaction.objectStore(FILES_STORE);
        const index = store.index('peerId');
        const request = index.getAll(peerId);

        request.onsuccess = () => {
            const files = (request.result as StoredFile[]).map(f => ({
                id: f.id,
                name: f.name,
                size: f.size,
                type: f.type,
                peerId: f.peerId,
                peerName: f.peerName,
                direction: f.direction,
                timestamp: f.timestamp,
            }));
            // Sort by timestamp
            files.sort((a, b) => b.timestamp - a.timestamp);
            resolve(files);
        };

        request.onerror = () => reject(request.error);
    });
}

// Delete a file
export async function deleteFile(fileId: string): Promise<void> {
    if (!db) throw new Error('Storage not initialized');

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction(FILES_STORE, 'readwrite');
        const store = transaction.objectStore(FILES_STORE);
        store.delete(fileId);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Clear all data
export async function clearAllData(): Promise<void> {
    if (!db) return;

    return new Promise((resolve, reject) => {
        const transaction = db!.transaction([FILES_STORE, PEERS_STORE], 'readwrite');
        transaction.objectStore(FILES_STORE).clear();
        transaction.objectStore(PEERS_STORE).clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

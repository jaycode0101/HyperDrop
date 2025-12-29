// Type definitions for HyperDrop

export interface DeviceInfo {
    name: string;
    id: string;
}

export interface FileInfo {
    file: File;
    id: string;
    preview?: string;
}

export interface TransferProgress {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
    speedBps: number; // bytes per second
    timeRemaining: number; // seconds
    status: 'pending' | 'connecting' | 'transferring' | 'complete' | 'error' | 'paused';
    error?: string;
}

export interface ReceivedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    blob: Blob;
    receivedAt: Date;
    senderName: string;
    transferSpeed: number;
    transferTime: number;
}

export interface ConnectionInfo {
    peerId: string;
    deviceName: string;
    offer?: string; // SDP offer for WebRTC
    encryptionKey?: string;
}

export type TabType = 'send' | 'receive' | 'history';

export interface PeerMessage {
    type: 'file-info' | 'chunk' | 'done' | 'error' | 'ack';
    data?: unknown;
}

export interface FileChunk {
    index: number;
    total: number;
    data: ArrayBuffer;
    fileId: string;
}

export interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    totalChunks: number;
}

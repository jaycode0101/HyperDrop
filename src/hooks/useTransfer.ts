import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { TransferProgress, FileMetadata } from '../types';

// LARGE chunks for maximum speed - 256KB
const CHUNK_SIZE = 256 * 1024;

// Speed calculation with moving average
const SPEED_SAMPLES = 5;

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT = 15000;

// ICE servers for NAT traversal - includes STUN and public TURN servers
const ICE_CONFIG = {
    iceServers: [
        // Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Open Relay TURN servers (free, community-supported)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

interface UseTransferOptions {
    onFileReceived?: (file: Blob, metadata: FileMetadata, peerName: string) => void;
    onError?: (error: string) => void;
}

function generatePeerId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'HD-';
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

export function useTransfer(options: UseTransferOptions = {}) {
    const [progress, setProgress] = useState<TransferProgress>({
        bytesTransferred: 0,
        totalBytes: 0,
        percentage: 0,
        speedBps: 0,
        timeRemaining: 0,
        status: 'pending',
    });

    const [peerName, setPeerName] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [isPeerReady, setIsPeerReady] = useState(false);
    const [connectionError, setConnectionError] = useState<string>('');
    const [currentFileName, setCurrentFileName] = useState<string>('');
    const [filesCompleted, setFilesCompleted] = useState<number>(0);
    const [totalFiles, setTotalFiles] = useState<number>(0);

    const peerRef = useRef<Peer | null>(null);
    const connectionRef = useRef<DataConnection | null>(null);
    const chunksRef = useRef<Uint8Array[]>([]);
    const metadataRef = useRef<FileMetadata | null>(null);
    const startTimeRef = useRef<number>(0);
    const deviceNameRef = useRef<string>('');
    const peerNameRef = useRef<string>('');
    const onFileReceivedRef = useRef(options.onFileReceived);

    // Speed calculation refs
    const speedSamplesRef = useRef<number[]>([]);
    const lastProgressTimeRef = useRef<number>(0);
    const lastProgressBytesRef = useRef<number>(0);

    useEffect(() => {
        onFileReceivedRef.current = options.onFileReceived;
    }, [options.onFileReceived]);

    // Calculate smoothed speed using moving average
    const calculateSpeed = useCallback((currentBytes: number): number => {
        const now = Date.now();
        const timeDiff = (now - lastProgressTimeRef.current) / 1000;

        if (timeDiff >= 0.2) { // Update every 200ms
            const bytesDiff = currentBytes - lastProgressBytesRef.current;
            const instantSpeed = bytesDiff / timeDiff;

            speedSamplesRef.current.push(instantSpeed);
            if (speedSamplesRef.current.length > SPEED_SAMPLES) {
                speedSamplesRef.current.shift();
            }

            lastProgressTimeRef.current = now;
            lastProgressBytesRef.current = currentBytes;
        }

        // Return average of samples
        if (speedSamplesRef.current.length === 0) return 0;
        return speedSamplesRef.current.reduce((a, b) => a + b, 0) / speedSamplesRef.current.length;
    }, []);

    const resetTransfer = useCallback(() => {
        setProgress({
            bytesTransferred: 0,
            totalBytes: 0,
            percentage: 0,
            speedBps: 0,
            timeRemaining: 0,
            status: 'pending',
        });
        chunksRef.current = [];
        metadataRef.current = null;
        startTimeRef.current = 0;
        speedSamplesRef.current = [];
        lastProgressTimeRef.current = 0;
        lastProgressBytesRef.current = 0;
        setConnectionError('');
        setCurrentFileName('');
        setFilesCompleted(0);
        setTotalFiles(0);
    }, []);

    const cleanup = useCallback(() => {
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setIsConnected(false);
        setIsPeerReady(false);
        setMyPeerId('');
    }, []);

    // Handle incoming data - BINARY for speed
    const handleIncomingData = useCallback((data: unknown) => {
        // Binary chunk data - handle both ArrayBuffer and Uint8Array
        // CRITICAL: We must COPY the data, not just slice/view it!
        // PeerJS may reuse internal buffers, corrupting our data if we don't copy.
        let buffer: ArrayBuffer | null = null;

        if (data instanceof ArrayBuffer) {
            // Copy the ArrayBuffer to avoid reference issues
            buffer = data.slice(0);
        } else if (data instanceof Uint8Array) {
            // Create a new ArrayBuffer with a proper copy of the data
            const copy = new Uint8Array(data.length);
            copy.set(data);
            buffer = copy.buffer;
        } else if (ArrayBuffer.isView(data)) {
            // For any other typed array view, copy properly
            const view = data as ArrayBufferView;
            const copy = new Uint8Array(view.byteLength);
            copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
            buffer = copy.buffer;
        }

        if (buffer) {
            const view = new DataView(buffer);
            const chunkIndex = view.getUint32(0, true); // Little endian
            // IMPORTANT: Create a proper copy of chunk data
            const chunkDataView = new Uint8Array(buffer, 4);
            const chunkData = new Uint8Array(chunkDataView.length);
            chunkData.set(chunkDataView);

            chunksRef.current[chunkIndex] = chunkData;

            const receivedBytes = chunksRef.current.reduce((sum, chunk) =>
                sum + (chunk ? chunk.byteLength : 0), 0);
            const totalBytes = metadataRef.current?.size || 1;
            const percentage = (receivedBytes / totalBytes) * 100;
            const speed = calculateSpeed(receivedBytes);
            const timeRemaining = speed > 0 ? (totalBytes - receivedBytes) / speed : 0;

            setProgress({
                bytesTransferred: receivedBytes,
                totalBytes,
                percentage,
                speedBps: speed,
                timeRemaining,
                status: 'transferring',
            });
            return;
        }

        // String messages for control
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);

                if (msg.type === 'device-name') {
                    setPeerName(msg.name);
                    peerNameRef.current = msg.name;
                } else if (msg.type === 'total-files') {
                    setTotalFiles(msg.count);
                    setFilesCompleted(0);
                } else if (msg.type === 'file-metadata') {
                    metadataRef.current = msg.metadata;
                    chunksRef.current = new Array(msg.metadata.totalChunks);
                    startTimeRef.current = Date.now();
                    speedSamplesRef.current = [];
                    lastProgressTimeRef.current = Date.now();
                    lastProgressBytesRef.current = 0;
                    setCurrentFileName(msg.metadata.name);
                    setProgress({
                        bytesTransferred: 0,
                        totalBytes: msg.metadata.size,
                        percentage: 0,
                        speedBps: 0,
                        timeRemaining: 0,
                        status: 'transferring',
                    });
                } else if (msg.type === 'file-complete') {
                    const metadata = metadataRef.current!;
                    // Filter out any undefined chunks and create blob from valid data
                    const validChunks = chunksRef.current.filter((chunk): chunk is Uint8Array => chunk !== undefined);
                    const blob = new Blob(validChunks as BlobPart[], { type: metadata.type });

                    const totalTime = (Date.now() - startTimeRef.current) / 1000;
                    const avgSpeed = metadata.size / totalTime;

                    onFileReceivedRef.current?.(blob, metadata, peerNameRef.current || 'Unknown Device');
                    setFilesCompleted(prev => prev + 1);

                    chunksRef.current = [];
                    metadataRef.current = null;

                    setProgress(prev => ({
                        ...prev,
                        percentage: 100,
                        speedBps: avgSpeed,
                        status: 'transferring',
                    }));
                } else if (msg.type === 'all-complete') {
                    setProgress(prev => ({
                        ...prev,
                        status: 'complete',
                    }));
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        }
    }, [calculateSpeed]);

    const setupConnection = useCallback((conn: DataConnection) => {
        connectionRef.current = conn;

        conn.on('open', () => {
            console.log('Connection opened');
            setIsConnected(true);
            conn.send(JSON.stringify({ type: 'device-name', name: deviceNameRef.current }));
        });

        conn.on('close', () => {
            console.log('Connection closed');
            setIsConnected(false);
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            setConnectionError('Connection error: ' + err.message);
        });

        conn.on('data', (data) => {
            handleIncomingData(data);
        });
    }, [handleIncomingData]);

    const initAsSender = useCallback((deviceName: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            cleanup();
            deviceNameRef.current = deviceName;

            const peerId = generatePeerId();
            console.log('Creating peer with ID:', peerId);

            const peer = new Peer(peerId, {
                debug: 1,
                config: ICE_CONFIG,
            });
            peerRef.current = peer;

            // Timeout for peer creation
            const timeout = setTimeout(() => {
                if (!peerRef.current?.open) {
                    setConnectionError('Connection timeout - try Local Mode if on hotspot');
                    cleanup();
                    reject(new Error('Peer creation timeout'));
                }
            }, CONNECTION_TIMEOUT);

            peer.on('open', (id) => {
                clearTimeout(timeout);
                console.log('Peer opened with ID:', id);
                setMyPeerId(id);
                setIsPeerReady(true);
                resolve(id);
            });

            peer.on('connection', (conn) => {
                console.log('Incoming connection from:', conn.peer);
                setupConnection(conn);
            });

            peer.on('error', (err) => {
                clearTimeout(timeout);
                console.error('Peer error:', err);
                const errorMsg = err.type === 'network'
                    ? 'Network error - check your connection or try Local Mode'
                    : err.type === 'peer-unavailable'
                        ? 'Peer not found - check the code and try again'
                        : 'Peer error: ' + err.message;
                setConnectionError(errorMsg);
                reject(err);
            });
        });
    }, [cleanup, setupConnection]);

    const connectToPeer = useCallback((peerId: string, deviceName: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            cleanup();
            deviceNameRef.current = deviceName;

            const myId = generatePeerId();
            console.log('Creating peer to connect, my ID:', myId);

            const peer = new Peer(myId, {
                debug: 1,
                config: ICE_CONFIG,
            });
            peerRef.current = peer;

            // Timeout for connection
            const timeout = setTimeout(() => {
                setConnectionError('Connection timeout - the sender may be offline or try Local Mode');
                cleanup();
                reject(new Error('Connection timeout'));
            }, CONNECTION_TIMEOUT);

            peer.on('open', () => {
                console.log('My peer opened, connecting to:', peerId);
                setMyPeerId(myId);
                setIsPeerReady(true);

                const conn = peer.connect(peerId, {
                    reliable: true,
                    serialization: 'binary', // Binary for fast ArrayBuffer transfer
                });
                setupConnection(conn);

                conn.on('open', () => {
                    clearTimeout(timeout);
                    console.log('Connected to peer:', peerId);
                    resolve();
                });

                conn.on('error', (err) => {
                    clearTimeout(timeout);
                    console.error('Connection error:', err);
                    reject(err);
                });
            });

            peer.on('error', (err) => {
                clearTimeout(timeout);
                console.error('Peer error:', err);
                const errorMsg = err.type === 'peer-unavailable'
                    ? `Peer "${peerId}" not found - check the code`
                    : err.type === 'network'
                        ? 'Network error - try Local Mode if on hotspot'
                        : 'Failed to connect: ' + err.message;
                setConnectionError(errorMsg);
                reject(err);
            });
        });
    }, [cleanup, setupConnection]);

    // FAST file sending - binary chunks, no encoding overhead
    const sendFiles = useCallback(async (files: File[]) => {
        if (!connectionRef.current || !connectionRef.current.open) {
            setConnectionError('Not connected');
            return;
        }

        const conn = connectionRef.current;
        setTotalFiles(files.length);
        setFilesCompleted(0);

        conn.send(JSON.stringify({ type: 'total-files', count: files.length }));

        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const fileId = Math.random().toString(36).substring(2);

            const metadata: FileMetadata = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                totalChunks,
            };

            setCurrentFileName(file.name);
            speedSamplesRef.current = [];
            lastProgressTimeRef.current = Date.now();
            lastProgressBytesRef.current = 0;

            conn.send(JSON.stringify({ type: 'file-metadata', metadata }));

            startTimeRef.current = Date.now();

            setProgress({
                bytesTransferred: 0,
                totalBytes: file.size,
                percentage: 0,
                speedBps: 0,
                timeRemaining: 0,
                status: 'transferring',
            });

            // Read entire file for faster access
            const arrayBuffer = await file.arrayBuffer();
            let sentBytes = 0;

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunkData = arrayBuffer.slice(start, end);

                // Create packet with chunk index prepended (4 bytes)
                const packet = new ArrayBuffer(4 + chunkData.byteLength);
                new DataView(packet).setUint32(0, i, true); // Little endian
                new Uint8Array(packet, 4).set(new Uint8Array(chunkData));

                // Wait for buffer to clear if too full
                while (conn.dataChannel && conn.dataChannel.bufferedAmount > 8 * 1024 * 1024) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }

                // Send binary directly
                conn.send(packet);

                sentBytes += chunkData.byteLength;

                // Update progress
                const speed = calculateSpeed(sentBytes);
                const percentage = (sentBytes / file.size) * 100;
                const timeRemaining = speed > 0 ? (file.size - sentBytes) / speed : 0;

                setProgress({
                    bytesTransferred: sentBytes,
                    totalBytes: file.size,
                    percentage,
                    speedBps: speed,
                    timeRemaining,
                    status: 'transferring',
                });
            }

            conn.send(JSON.stringify({ type: 'file-complete' }));
            setFilesCompleted(fileIndex + 1);

            // Small gap between files
            if (fileIndex < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        conn.send(JSON.stringify({ type: 'all-complete' }));

        const totalTime = (Date.now() - startTimeRef.current) / 1000;
        const lastFile = files[files.length - 1];

        setProgress(prev => ({
            ...prev,
            percentage: 100,
            speedBps: lastFile.size / totalTime,
            status: 'complete',
        }));
    }, [calculateSpeed]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        progress,
        peerName,
        isConnected,
        myPeerId,
        isPeerReady,
        connectionError,
        currentFileName,
        filesCompleted,
        totalFiles,
        initAsSender,
        connectToPeer,
        sendFiles,
        resetTransfer,
        cleanup,
    };
}

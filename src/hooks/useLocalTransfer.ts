/**
 * Local Transfer Hook - HTTP-based file transfer fallback
 * Uses BroadcastChannel for same-origin transfers (max 5MB)
 */


import { useState, useCallback, useRef, useEffect } from 'react';
import { generateSessionToken } from '../utils/network';
import type { FileMetadata, TransferProgress } from '../types';

// Use the Vite dev server or current origin for local transfers
const getBaseUrl = () => {
    // In development, use the Vite server
    // In production, this would need a separate server
    return window.location.origin;
};

interface LocalSession {
    token: string;
    isHost: boolean;
    hostUrl: string;
    connectedPeer: string | null;
}

interface PendingFile {
    id: string;
    name: string;
    size: number;
    type: string;
    blob: Blob;
}

interface UseLocalTransferOptions {
    deviceName: string;
    onFileReceived?: (file: Blob, metadata: FileMetadata, peerName: string) => void;
    onError?: (error: string) => void;
}

export function useLocalTransfer(options: UseLocalTransferOptions) {
    const [session, setSession] = useState<LocalSession | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [peerName, setPeerName] = useState('');
    const [progress, setProgress] = useState<TransferProgress>({
        bytesTransferred: 0,
        totalBytes: 0,
        percentage: 0,
        speedBps: 0,
        timeRemaining: 0,
        status: 'pending',
    });
    const [error, setError] = useState('');
    const [pendingFiles] = useState<PendingFile[]>([]);

    const pollingRef = useRef<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const onFileReceivedRef = useRef(options.onFileReceived);

    useEffect(() => {
        onFileReceivedRef.current = options.onFileReceived;
    }, [options.onFileReceived]);

    // For local mode, we use BroadcastChannel + localStorage as a simple signaling mechanism
    // This works when both devices access the same origin (e.g., localhost or LAN IP)
    const channelRef = useRef<BroadcastChannel | null>(null);
    const sessionStorageKey = 'hyperdrop_local_session';

    // Start as host - generate session and wait for connections
    const startAsHost = useCallback((): string => {
        const token = generateSessionToken();
        const hostUrl = `${getBaseUrl()}?local=${token}`;

        const newSession: LocalSession = {
            token,
            isHost: true,
            hostUrl,
            connectedPeer: null,
        };

        setSession(newSession);
        setError('');

        // Store session info for discovery
        const sessionData = {
            token,
            hostName: options.deviceName,
            timestamp: Date.now(),
            files: [] as PendingFile[],
        };
        localStorage.setItem(`${sessionStorageKey}_${token}`, JSON.stringify(sessionData));

        // Set up broadcast channel for real-time updates
        channelRef.current = new BroadcastChannel(`hyperdrop_local_${token}`);
        channelRef.current.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === 'join') {
                setPeerName(msg.deviceName);
                setIsConnected(true);
                // Respond with host info
                channelRef.current?.postMessage({
                    type: 'host-info',
                    deviceName: options.deviceName,
                });
            } else if (msg.type === 'file-offer') {
                // Peer is offering to send a file
                // Accept it automatically
                channelRef.current?.postMessage({ type: 'file-accept', fileId: msg.fileId });
            } else if (msg.type === 'file-data') {
                // Received file data
                handleReceivedFile(msg);
            }
        };

        return hostUrl;
    }, [options.deviceName]);

    // Join an existing session
    const joinSession = useCallback(async (urlOrToken: string): Promise<void> => {
        let token = urlOrToken;

        // Extract token from URL if needed
        if (urlOrToken.includes('?local=')) {
            const match = urlOrToken.match(/local=([a-f0-9]+)/);
            if (match) token = match[1];
        }

        setError('');

        // Look for session in localStorage
        const sessionData = localStorage.getItem(`${sessionStorageKey}_${token}`);
        if (!sessionData) {
            setError('Session not found. Make sure both devices are on the same network.');
            return;
        }

        const parsed = JSON.parse(sessionData);
        setPeerName(parsed.hostName);

        const newSession: LocalSession = {
            token,
            isHost: false,
            hostUrl: `${getBaseUrl()}?local=${token}`,
            connectedPeer: parsed.hostName,
        };

        setSession(newSession);

        // Set up broadcast channel
        channelRef.current = new BroadcastChannel(`hyperdrop_local_${token}`);
        channelRef.current.onmessage = (event) => {
            const msg = event.data;
            if (msg.type === 'host-info') {
                setPeerName(msg.deviceName);
                setIsConnected(true);
            } else if (msg.type === 'file-accept') {
                // Host accepted our file, start sending
            } else if (msg.type === 'file-data') {
                handleReceivedFile(msg);
            }
        };

        // Announce ourselves
        channelRef.current.postMessage({
            type: 'join',
            deviceName: options.deviceName,
        });

        setIsConnected(true);
    }, [options.deviceName]);

    // Handle received file
    const handleReceivedFile = useCallback((msg: {
        metadata: FileMetadata;
        data: string;
        senderName: string
    }) => {
        try {
            // Decode base64 data
            const binaryString = atob(msg.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: msg.metadata.type });

            onFileReceivedRef.current?.(blob, msg.metadata, msg.senderName);

            setProgress(prev => ({
                ...prev,
                status: 'complete',
                percentage: 100,
            }));
        } catch (e) {
            console.error('Error receiving file:', e);
            setError('Failed to receive file');
        }
    }, []);

    // Send files via local mode
    const sendFiles = useCallback(async (files: File[]) => {
        if (!channelRef.current || !session) {
            setError('Not connected');
            return;
        }

        setProgress({
            bytesTransferred: 0,
            totalBytes: files.reduce((sum, f) => sum + f.size, 0),
            percentage: 0,
            speedBps: 0,
            timeRemaining: 0,
            status: 'transferring',
        });

        const startTime = Date.now();
        let totalSent = 0;

        for (const file of files) {
            const metadata: FileMetadata = {
                id: Math.random().toString(36).substring(2),
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                totalChunks: 1, // For local mode, we send as one chunk
            };

            try {
                // For small files (< 5MB), send directly via BroadcastChannel
                // For larger files, this approach won't work well
                if (file.size > 5 * 1024 * 1024) {
                    setError('Local mode only supports files up to 5MB. Use P2P mode for larger files.');
                    return;
                }

                const arrayBuffer = await file.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

                channelRef.current.postMessage({
                    type: 'file-data',
                    metadata,
                    data: base64,
                    senderName: options.deviceName,
                });

                totalSent += file.size;
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = totalSent / elapsed;

                setProgress({
                    bytesTransferred: totalSent,
                    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
                    percentage: (totalSent / files.reduce((sum, f) => sum + f.size, 0)) * 100,
                    speedBps: speed,
                    timeRemaining: 0,
                    status: 'transferring',
                });
            } catch (e) {
                console.error('Error sending file:', e);
                setError('Failed to send file: ' + (e instanceof Error ? e.message : 'Unknown error'));
                return;
            }
        }

        setProgress(prev => ({
            ...prev,
            status: 'complete',
            percentage: 100,
        }));
    }, [session, options.deviceName]);

    // Cleanup
    const cleanup = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (channelRef.current) {
            channelRef.current.close();
            channelRef.current = null;
        }
        if (session?.token) {
            localStorage.removeItem(`${sessionStorageKey}_${session.token}`);
        }
        setSession(null);
        setIsConnected(false);
        setPeerName('');
        setError('');
        setProgress({
            bytesTransferred: 0,
            totalBytes: 0,
            percentage: 0,
            speedBps: 0,
            timeRemaining: 0,
            status: 'pending',
        });
    }, [session]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        session,
        isConnected,
        peerName,
        progress,
        error,
        pendingFiles,
        startAsHost,
        joinSession,
        sendFiles,
        cleanup,
    };
}

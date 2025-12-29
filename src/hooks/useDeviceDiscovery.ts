import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkDevice {
    id: string;
    name: string;
    ip: string;
    port: number;
    offer: string;
    timestamp: number;
}

const BROADCAST_INTERVAL = 2000; // 2 seconds
const DEVICE_TIMEOUT = 10000; // 10 seconds

// We'll use BroadcastChannel for same-origin discovery
// and localStorage for cross-tab discovery
const CHANNEL_NAME = 'hyperdrop-discovery';
const STORAGE_KEY = 'hyperdrop-devices';

export function useDeviceDiscovery(myDeviceName: string, myDeviceId: string) {
    const [devices, setDevices] = useState<NetworkDevice[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [myOffer, setMyOffer] = useState<string>('');
    const channelRef = useRef<BroadcastChannel | null>(null);
    const intervalRef = useRef<number | null>(null);

    // Broadcast my presence
    const broadcastPresence = useCallback(() => {
        if (!myOffer) return;

        const myDevice: NetworkDevice = {
            id: myDeviceId,
            name: myDeviceName,
            ip: window.location.hostname,
            port: parseInt(window.location.port) || 80,
            offer: myOffer,
            timestamp: Date.now(),
        };

        // Broadcast via BroadcastChannel
        if (channelRef.current) {
            channelRef.current.postMessage({ type: 'announce', device: myDevice });
        }

        // Also save to localStorage for cross-tab
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const filtered = existing.filter((d: NetworkDevice) => d.id !== myDeviceId);
            filtered.push(myDevice);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (e) {
            console.error('Failed to save device to storage:', e);
        }
    }, [myDeviceId, myDeviceName, myOffer]);

    // Start discovering
    const startDiscovery = useCallback((offer: string) => {
        setMyOffer(offer);
        setIsDiscovering(true);

        // Create broadcast channel
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);

        channelRef.current.onmessage = (event) => {
            if (event.data.type === 'announce') {
                const device = event.data.device as NetworkDevice;
                if (device.id !== myDeviceId) {
                    setDevices(prev => {
                        const existing = prev.findIndex(d => d.id === device.id);
                        if (existing >= 0) {
                            const updated = [...prev];
                            updated[existing] = device;
                            return updated;
                        }
                        return [...prev, device];
                    });
                }
            }
        };

        // Start broadcasting
        intervalRef.current = window.setInterval(() => {
            broadcastPresence();

            // Clean up stale devices
            setDevices(prev => prev.filter(d =>
                Date.now() - d.timestamp < DEVICE_TIMEOUT
            ));

            // Check localStorage for other devices
            try {
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const validDevices = stored.filter((d: NetworkDevice) =>
                    d.id !== myDeviceId && Date.now() - d.timestamp < DEVICE_TIMEOUT
                );

                setDevices(prev => {
                    const merged = [...prev];
                    for (const device of validDevices) {
                        const existing = merged.findIndex(d => d.id === device.id);
                        if (existing >= 0) {
                            merged[existing] = device;
                        } else {
                            merged.push(device);
                        }
                    }
                    return merged;
                });
            } catch (e) {
                // Ignore
            }
        }, BROADCAST_INTERVAL);
    }, [myDeviceId, broadcastPresence]);

    // Stop discovering
    const stopDiscovery = useCallback(() => {
        setIsDiscovering(false);
        setMyOffer('');

        if (channelRef.current) {
            channelRef.current.close();
            channelRef.current = null;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Remove self from storage
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const filtered = stored.filter((d: NetworkDevice) => d.id !== myDeviceId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (e) {
            // Ignore
        }
    }, [myDeviceId]);

    // Broadcast when offer changes
    useEffect(() => {
        if (myOffer && isDiscovering) {
            broadcastPresence();
        }
    }, [myOffer, isDiscovering, broadcastPresence]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDiscovery();
        };
    }, [stopDiscovery]);

    return {
        devices,
        isDiscovering,
        startDiscovery,
        stopDiscovery,
    };
}

import { useState, useEffect, useCallback } from 'react';

const DEVICE_NAME_KEY = 'hyperdrop_device_name';
const DEVICE_ID_KEY = 'hyperdrop_device_id';

function generateDeviceId(): string {
    return 'HD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function suggestDeviceName(): string {
    const userAgent = navigator.userAgent;
    let deviceType = 'Device';

    if (/iPhone/i.test(userAgent)) deviceType = 'iPhone';
    else if (/iPad/i.test(userAgent)) deviceType = 'iPad';
    else if (/Android/i.test(userAgent)) deviceType = 'Android';
    else if (/Mac/i.test(userAgent)) deviceType = 'Mac';
    else if (/Windows/i.test(userAgent)) deviceType = 'Windows PC';
    else if (/Linux/i.test(userAgent)) deviceType = 'Linux PC';

    return `My ${deviceType}`;
}

export function useDeviceName() {
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage
        const savedName = localStorage.getItem(DEVICE_NAME_KEY);
        let savedId = localStorage.getItem(DEVICE_ID_KEY);

        if (!savedId) {
            savedId = generateDeviceId();
            localStorage.setItem(DEVICE_ID_KEY, savedId);
        }

        setDeviceId(savedId);
        setDeviceName(savedName);
        setIsLoading(false);
    }, []);

    const updateDeviceName = useCallback((name: string) => {
        const trimmedName = name.trim();
        if (trimmedName) {
            localStorage.setItem(DEVICE_NAME_KEY, trimmedName);
            setDeviceName(trimmedName);
        }
    }, []);

    const suggestedName = suggestDeviceName();

    return {
        deviceName,
        deviceId,
        isLoading,
        isSetupComplete: deviceName !== null,
        updateDeviceName,
        suggestedName,
    };
}


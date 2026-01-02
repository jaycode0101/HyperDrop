// Network utilities


// Generate a secure session token
export function generateSessionToken(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Check if an IP is a local/private IP
export function isLocalIP(ip: string): boolean {
    // Private IP ranges
    const privateRanges = [
        /^10\./,                     // 10.0.0.0 - 10.255.255.255
        /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0 - 172.31.255.255
        /^192\.168\./,               // 192.168.0.0 - 192.168.255.255
        /^127\./,                    // Loopback
        /^169\.254\./,               // Link-local
    ];
    return privateRanges.some(range => range.test(ip));
}

// Get approximate local IP using WebRTC (for display purposes)
export async function getLocalIP(): Promise<string | null> {
    return new Promise((resolve) => {
        // This method works in most browsers but may be blocked by some
        try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');

            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    pc.close();
                    resolve(null);
                    return;
                }

                const candidate = event.candidate.candidate;
                const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);

                if (ipMatch && isLocalIP(ipMatch[0])) {
                    pc.close();
                    resolve(ipMatch[0]);
                }
            };

            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(() => {
                    pc.close();
                    resolve(null);
                });

            // Timeout after 3 seconds
            setTimeout(() => {
                pc.close();
                resolve(null);
            }, 3000);
        } catch {
            resolve(null);
        }
    });
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format speed (bytes per second)
export function formatSpeed(bps: number): string {
    return formatBytes(bps) + '/s';
}

// Format time remaining
export function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// Check if WebRTC is supported
export function isWebRTCSupported(): boolean {
    return !!(
        window.RTCPeerConnection &&
        navigator.mediaDevices &&
        window.RTCSessionDescription
    );
}

// Check if the device appears to be on a mobile hotspot
// This is heuristic-based and not 100% reliable
export function mightBeOnHotspot(): boolean {
    // Check if we're on a mobile device acting as hotspot
    // or connected to one (common IP patterns)
    const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
    if (connection?.type === 'cellular') {
        return true;
    }
    return false;
}

// Parse a connection URL (for local mode)
export function parseConnectionUrl(url: string): { host: string; port: number; token: string } | null {
    try {
        const parsed = new URL(url);
        const token = parsed.searchParams.get('token') || parsed.pathname.split('/').pop() || '';
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
            token,
        };
    } catch {
        return null;
    }
}

// Create a connection URL for local mode
export function createConnectionUrl(host: string, port: number, token: string): string {
    return `http://${host}:${port}/?token=${token}`;
}

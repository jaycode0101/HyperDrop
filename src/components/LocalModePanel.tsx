import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Copy, Check, QrCode, ArrowRight, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getLocalIP } from '../utils/network';

interface LocalModePanelProps {
    deviceName: string;
    onStartHost: () => string;
    onJoinSession: (url: string) => Promise<void>;
    isConnected: boolean;
    peerName: string;
    error: string;
    hostUrl?: string;
}

export function LocalModePanel({
    onStartHost,
    onJoinSession,
    isConnected,
    peerName,
    error,
}: LocalModePanelProps) {
    const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
    const [sessionUrl, setSessionUrl] = useState('');
    const [joinInput, setJoinInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [localIP, setLocalIP] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        getLocalIP().then(setLocalIP);
    }, []);

    const handleStartHost = () => {
        setMode('host');
        const url = onStartHost();
        setSessionUrl(url);
    };

    const handleJoin = async () => {
        if (!joinInput.trim()) return;
        setIsJoining(true);
        try {
            await onJoinSession(joinInput.trim());
        } finally {
            setIsJoining(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sessionUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const el = document.createElement('input');
            el.value = sessionUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isConnected) {
        return (
            <div className="card-glass" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div className="flex items-center justify-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                    <Wifi size={24} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Connected via Local Mode</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Connected to <strong>{peerName}</strong>
                </p>
            </div>
        );
    }

    return (
        <div className="card-glass" style={{ padding: 'var(--space-lg)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                <WifiOff size={20} style={{ color: 'var(--warning)' }} />
                <span style={{ fontWeight: 600 }}>Local Mode</span>
            </div>

            <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-md)',
            }}>
                Use this when P2P fails (e.g., on mobile hotspots). Both devices must access this page from the same network.
            </p>

            {localIP && (
                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-xs)',
                    marginBottom: 'var(--space-md)',
                }}>
                    Your local IP: <code style={{ color: 'var(--primary)' }}>{localIP}</code>
                </p>
            )}

            {mode === 'select' && (
                <div className="flex gap-md">
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleStartHost}
                    >
                        <Wifi size={18} />
                        Host Session
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setMode('join')}
                    >
                        <ArrowRight size={18} />
                        Join Session
                    </button>
                </div>
            )}

            {mode === 'host' && (
                <div className="animate-fadeIn">
                    <p style={{
                        textAlign: 'center',
                        marginBottom: 'var(--space-md)',
                        color: 'var(--text-secondary)',
                    }}>
                        Share this URL with the other device:
                    </p>

                    <div style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-md)',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-sm)',
                    }}>
                        {sessionUrl}
                    </div>

                    <div className="flex gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCopy}>
                            {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy URL</>}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowQR(!showQR)}
                        >
                            <QrCode size={18} />
                        </button>
                    </div>

                    {showQR && (
                        <div className="animate-fadeIn" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            padding: 'var(--space-md)',
                            background: 'white',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-md)',
                        }}>
                            <QRCodeSVG value={sessionUrl} size={200} />
                        </div>
                    )}

                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-size-xs)',
                    }}>
                        Waiting for connection...
                    </p>
                </div>
            )}

            {mode === 'join' && (
                <div className="animate-fadeIn">
                    <p style={{
                        textAlign: 'center',
                        marginBottom: 'var(--space-md)',
                        color: 'var(--text-secondary)',
                    }}>
                        Enter the session URL or token:
                    </p>

                    <input
                        type="text"
                        className="input"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        placeholder="http://192.168.x.x:5173?local=..."
                        style={{ marginBottom: 'var(--space-md)' }}
                    />

                    <button
                        className="btn btn-primary w-full"
                        onClick={handleJoin}
                        disabled={!joinInput.trim() || isJoining}
                    >
                        {isJoining ? (
                            <><Loader2 size={18} className="animate-spin" /> Connecting...</>
                        ) : (
                            <><ArrowRight size={18} /> Connect</>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: 'var(--space-md)',
                    padding: 'var(--space-sm)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--error)',
                    fontSize: 'var(--font-size-sm)',
                }}>
                    {error}
                </div>
            )}

            {mode !== 'select' && (
                <button
                    className="btn btn-ghost w-full"
                    style={{ marginTop: 'var(--space-md)' }}
                    onClick={() => setMode('select')}
                >
                    ← Back
                </button>
            )}
        </div>
    );
}

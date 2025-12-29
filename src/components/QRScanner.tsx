import { useEffect, useRef, useState, useCallback } from 'react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCamera, setHasCamera] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);
    const scanningRef = useRef(false);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        scanningRef.current = false;
    }, []);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsLoading(false);
                scanningRef.current = true;
                scanQRCode();
            }
        } catch (err) {
            console.error('Camera error:', err);
            setHasCamera(false);
            setIsLoading(false);
            setShowManual(true);
        }
    }, []);

    const scanQRCode = useCallback(() => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scanQRCode);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // QR scanning would happen here with jsQR library
        // For now using manual code entry

        requestAnimationFrame(scanQRCode);
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            try {
                // Validate it's valid JSON
                JSON.parse(manualCode);
                stopCamera();
                onScan(manualCode);
            } catch {
                onError?.('Invalid connection code');
            }
        }
    };

    const handleClose = () => {
        stopCamera();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal animate-scaleIn"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 400, padding: 'var(--space-lg)' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-md">
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                        {showManual ? 'Enter Code' : 'Scan QR Code'}
                    </h2>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {!showManual && hasCamera && (
                    <>
                        {/* Camera View */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            background: 'var(--bg-tertiary)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin" style={{ fontSize: 32 }}>⏳</div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: isLoading ? 'none' : 'block'
                                }}
                                playsInline
                                muted
                            />

                            {/* Scan overlay */}
                            {!isLoading && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        width: '70%',
                                        height: '70%',
                                        border: '3px solid var(--primary)',
                                        borderRadius: 'var(--radius-lg)',
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                                        animation: 'pulse 2s ease-in-out infinite'
                                    }} />
                                </div>
                            )}

                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>

                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--font-size-sm)',
                            textAlign: 'center',
                            marginBottom: 'var(--space-md)'
                        }}>
                            Point camera at the sender's QR code
                        </p>
                    </>
                )}

                {/* Manual Entry */}
                {(showManual || !hasCamera) && (
                    <form onSubmit={handleManualSubmit}>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--font-size-sm)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            {!hasCamera
                                ? 'Camera not available. Enter the connection code manually:'
                                : 'Enter the connection code:'}
                        </p>

                        <textarea
                            className="input"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            placeholder='Paste connection code here...'
                            rows={4}
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 'var(--font-size-sm)',
                                marginBottom: 'var(--space-md)'
                            }}
                        />

                        <button type="submit" className="btn btn-primary w-full">
                            Connect
                        </button>
                    </form>
                )}

                {/* Toggle */}
                {hasCamera && (
                    <button
                        className="btn btn-ghost w-full mt-md"
                        onClick={() => setShowManual(!showManual)}
                    >
                        {showManual ? '📷 Use Camera' : '⌨️ Enter Code Manually'}
                    </button>
                )}
            </div>
        </div>
    );
}

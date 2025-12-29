import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
    data: string;
    isActive?: boolean;
}

export function QRGenerator({ data, isActive = true }: QRGeneratorProps) {
    return (
        <div className="qr-container animate-fadeIn">
            {/* QR Code */}
            <div
                className={`qr-wrapper ${isActive ? 'animate-glow' : ''}`}
                style={{
                    background: 'white',
                    padding: 'var(--space-lg)',
                    borderRadius: 'var(--radius-xl)',
                }}
            >
                <QRCodeSVG
                    value={data}
                    size={200}
                    level="L"
                    bgColor="white"
                    fgColor="#1F2937"
                    style={{ display: 'block' }}
                />
            </div>

            {/* Status */}
            <div className={`qr-status ${isActive ? 'active' : ''}`}>
                {isActive && (
                    <span className="animate-pulse" style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--success)',
                        display: 'inline-block'
                    }} />
                )}
                <span>{isActive ? 'Waiting for scan...' : 'QR Code Ready'}</span>
            </div>

            {/* Instructions */}
            <p style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                textAlign: 'center',
                maxWidth: 280
            }}>
                Ask the receiver to scan this QR code with their HyperDrop app
            </p>
        </div>
    );
}

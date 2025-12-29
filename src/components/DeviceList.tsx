interface NetworkDevice {
    id: string;
    name: string;
    ip: string;
    port: number;
    offer: string;
    timestamp: number;
}

interface DeviceListProps {
    devices: NetworkDevice[];
    onSelect: (device: NetworkDevice) => void;
    isDiscovering: boolean;
}

function formatTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
}

export function DeviceList({ devices, onSelect, isDiscovering }: DeviceListProps) {
    if (devices.length === 0) {
        return (
            <div className="card-glass animate-fadeIn" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 'var(--space-md)' }}>
                    {isDiscovering ? (
                        <span className="animate-pulse">📡</span>
                    ) : (
                        '📡'
                    )}
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                    {isDiscovering ? 'Searching for devices...' : 'No Devices Found'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {isDiscovering
                        ? 'Make sure both devices are on the same network'
                        : 'Devices will appear when they start sharing'
                    }
                </p>

                {isDiscovering && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="progress-container" style={{ height: 4 }}>
                            <div
                                className="progress-bar"
                                style={{
                                    width: '30%',
                                    animation: 'progressFlow 1s linear infinite, pulse 1s ease-in-out infinite'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
            }}>
                {isDiscovering && (
                    <span className="animate-pulse" style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--success)',
                        display: 'inline-block'
                    }} />
                )}
                <span>{devices.length} device{devices.length !== 1 ? 's' : ''} found</span>
            </div>

            <div className="flex flex-col gap-md">
                {devices.map((device, index) => (
                    <button
                        key={device.id}
                        className="file-item animate-slideIn"
                        onClick={() => onSelect(device)}
                        style={{
                            animationDelay: `${index * 50}ms`,
                            cursor: 'pointer',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left'
                        }}
                    >
                        {/* Icon */}
                        <div className="file-icon" style={{ fontSize: 24 }}>
                            💻
                        </div>

                        {/* Info */}
                        <div className="file-info">
                            <div className="file-name">{device.name}</div>
                            <div className="file-meta">
                                <span style={{ color: 'var(--success)' }}>● Online</span>
                                <span style={{ margin: '0 var(--space-xs)' }}>•</span>
                                {formatTime(device.timestamp)}
                            </div>
                        </div>

                        {/* Connect arrow */}
                        <div style={{
                            color: 'var(--primary)',
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 'bold'
                        }}>
                            →
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Modern loading spinner component
interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

export function LoadingSpinner({ size = 40, className = '' }: LoadingSpinnerProps) {
    return (
        <div className={`loading-spinner ${className}`} style={{ width: size, height: size }}>
            <svg
                viewBox="0 0 50 50"
                style={{ width: '100%', height: '100%' }}
            >
                <circle
                    className="spinner-track"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                    stroke="currentColor"
                    opacity="0.2"
                />
                <circle
                    className="spinner-head"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                    stroke="url(#spinner-gradient)"
                    strokeLinecap="round"
                    strokeDasharray="80, 200"
                    strokeDashoffset="0"
                />
                <defs>
                    <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

// Pulsing dot indicator
interface PulsingDotProps {
    color?: string;
    size?: number;
}

export function PulsingDot({ color = 'var(--success)', size = 8 }: PulsingDotProps) {
    return (
        <span
            className="pulsing-dot"
            style={{
                width: size,
                height: size,
                background: color,
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: `0 0 0 0 ${color}`,
            }}
        />
    );
}

// Success checkmark animation
export function SuccessCheck({ size = 64 }: { size?: number }) {
    return (
        <div className="success-check" style={{ width: size, height: size }}>
            <svg viewBox="0 0 52 52" style={{ width: '100%', height: '100%' }}>
                <circle
                    className="success-circle"
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="3"
                />
                <path
                    className="success-checkmark"
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l7 7 16-16"
                />
            </svg>
        </div>
    );
}

// Error X animation
export function ErrorX({ size = 64 }: { size?: number }) {
    return (
        <div className="error-x" style={{ width: size, height: size }}>
            <svg viewBox="0 0 52 52" style={{ width: '100%', height: '100%' }}>
                <circle
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="3"
                />
                <path
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    d="M16 16l20 20M36 16l-20 20"
                />
            </svg>
        </div>
    );
}

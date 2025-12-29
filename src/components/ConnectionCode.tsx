import { useState } from 'react';

interface ConnectionCodeProps {
    code: string;
    onConnect: (code: string) => void;
    mode: 'share' | 'enter';
}

export function ConnectionCode({ code, onConnect, mode }: ConnectionCodeProps) {
    const [inputCode, setInputCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleConnect = () => {
        const trimmed = inputCode.trim();
        if (!trimmed) {
            setError('Please enter a connection code');
            return;
        }

        try {
            JSON.parse(trimmed);
            setError('');
            onConnect(trimmed);
        } catch {
            setError('Invalid connection code');
        }
    };

    if (mode === 'share') {
        return (
            <div className="card-glass animate-fadeIn" style={{ padding: 'var(--space-lg)' }}>
                <div className="text-center mb-md">
                    <div style={{ fontSize: 32, marginBottom: 'var(--space-sm)' }}>🔗</div>
                    <h3 style={{ fontWeight: 600 }}>Connection Code</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Share this code with the receiver
                    </p>
                </div>

                {/* Code display */}
                <div style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)',
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-xs)',
                    wordBreak: 'break-all',
                    maxHeight: 120,
                    overflow: 'auto',
                    marginBottom: 'var(--space-md)',
                }}>
                    {code || 'Generating...'}
                </div>

                <button
                    className="btn btn-primary w-full"
                    onClick={handleCopy}
                    disabled={!code}
                >
                    {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
            </div>
        );
    }

    // Enter mode
    return (
        <div className="card-glass animate-fadeIn" style={{ padding: 'var(--space-lg)' }}>
            <div className="text-center mb-md">
                <div style={{ fontSize: 32, marginBottom: 'var(--space-sm)' }}>⌨️</div>
                <h3 style={{ fontWeight: 600 }}>Enter Connection Code</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Paste the code from the sender
                </p>
            </div>

            <textarea
                className="input"
                value={inputCode}
                onChange={(e) => {
                    setInputCode(e.target.value);
                    setError('');
                }}
                placeholder="Paste connection code here..."
                rows={4}
                style={{
                    fontFamily: 'monospace',
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: 'var(--space-sm)',
                    resize: 'none',
                }}
            />

            {error && (
                <p style={{
                    color: 'var(--error)',
                    fontSize: 'var(--font-size-sm)',
                    marginBottom: 'var(--space-sm)'
                }}>
                    {error}
                </p>
            )}

            <button
                className="btn btn-primary w-full"
                onClick={handleConnect}
                disabled={!inputCode.trim()}
            >
                🔗 Connect
            </button>
        </div>
    );
}

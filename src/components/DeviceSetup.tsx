import { useState } from 'react';
import { Zap, Smartphone, ArrowRight, Shield, Wifi, Lock } from 'lucide-react';
import { useDeviceName } from '../hooks/useDeviceName';
import { LoadingSpinner } from './LoadingSpinner';

interface DeviceSetupProps {
    onComplete: () => void;
}

export function DeviceSetup({ onComplete }: DeviceSetupProps) {
    const { suggestedName, updateDeviceName } = useDeviceName();
    const [name, setName] = useState(suggestedName);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        await updateDeviceName(name.trim());

        setTimeout(() => {
            setIsLoading(false);
            onComplete();
        }, 500);
    };

    return (
        <div className="modal-overlay">
            <div className="modal animate-scaleIn" style={{ maxWidth: 420, textAlign: 'center' }}>
                {/* Logo */}
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        width: 88,
                        height: 88,
                        borderRadius: 'var(--radius-xl)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-lg)',
                        boxShadow: 'var(--shadow-glow)',
                    }}>
                        <Zap size={44} color="white" />
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                        HyperDrop
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
                        Share files at lightning speed, securely
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-xs)',
                            marginBottom: 'var(--space-sm)',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--font-size-sm)',
                        }}>
                            <Smartphone size={16} />
                            Name your device
                        </label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Device"
                            autoFocus
                            style={{ textAlign: 'center', fontSize: 'var(--font-size-lg)' }}
                        />
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: 'var(--font-size-xs)',
                            marginTop: 'var(--space-sm)',
                        }}>
                            This name will be visible to devices you connect with
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? (
                            <LoadingSpinner size={24} />
                        ) : (
                            <>Get Started <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                {/* Features */}
                <div style={{
                    marginTop: 'var(--space-xl)',
                    paddingTop: 'var(--space-lg)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-sm)',
                }}>
                    <div style={{ padding: 'var(--space-sm)' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-xs)',
                        }}>
                            <Wifi size={18} style={{ color: 'var(--success)' }} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>P2P Direct</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No server needed</div>
                    </div>
                    <div style={{ padding: 'var(--space-sm)' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-xs)',
                        }}>
                            <Shield size={18} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>Encrypted</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>End-to-end</div>
                    </div>
                    <div style={{ padding: 'var(--space-sm)' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(236, 72, 153, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-xs)',
                        }}>
                            <Lock size={18} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>Private</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No cloud storage</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

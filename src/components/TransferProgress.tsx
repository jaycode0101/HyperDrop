import { Send, Download, Clock, Gauge, X, CheckCircle } from 'lucide-react';
import type { TransferProgress } from '../types';

interface TransferProgressDisplayProps {
    progress: TransferProgress;
    peerName: string;
    fileName: string;
    mode: 'sending' | 'receiving';
    onCancel?: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond === 0) return '--';
    if (bytesPerSecond < 1024) return bytesPerSecond.toFixed(0) + ' B/s';
    if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
    return (bytesPerSecond / (1024 * 1024)).toFixed(2) + ' MB/s';
}

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds) || seconds < 0) return '--';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.ceil(seconds % 60);
        return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
}

// Circular Progress Ring Component
function ProgressRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="progress-ring" style={{ width: size, height: size }}>
            <svg className="progress-ring-svg" width={size} height={size}>
                <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="50%" stopColor="var(--primary-light)" />
                        <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                </defs>
                <circle
                    className="progress-ring-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-ring-progress"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    style={{ stroke: 'url(#progress-gradient)' }}
                />
            </svg>
            <div className="progress-ring-text">
                <span className="progress-ring-percentage">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
}

export function TransferProgressDisplay({
    progress,
    peerName,
    fileName,
    mode,
    onCancel
}: TransferProgressDisplayProps) {
    const isComplete = progress.status === 'complete';

    return (
        <div className="card-glass animate-fadeIn" style={{ padding: 'var(--space-lg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex items-center gap-md">
                    <div className="file-type-icon" style={{
                        background: isComplete ? 'var(--success)' : 'var(--gradient-primary)',
                        width: 44,
                        height: 44,
                    }}>
                        {isComplete ? <CheckCircle size={22} /> : mode === 'sending' ? <Send size={22} /> : <Download size={22} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                            {fileName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {mode === 'sending' ? 'To' : 'From'} {peerName || 'connecting...'}
                        </div>
                    </div>
                </div>

                {onCancel && !isComplete && (
                    <button className="icon-btn danger" onClick={onCancel} title="Cancel">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Progress Ring + Stats */}
            <div className="flex items-center justify-center gap-xl" style={{ marginBottom: 'var(--space-lg)' }}>
                <ProgressRing percentage={Math.min(progress.percentage, 100)} size={100} />

                <div className="flex flex-col gap-sm" style={{ minWidth: 120 }}>
                    <div className="flex items-center gap-sm">
                        <Gauge size={16} style={{ color: 'var(--accent)', opacity: 0.8 }} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{formatSpeed(progress.speedBps)}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Speed</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-sm">
                        <Clock size={16} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                                {isComplete ? 'Done' : formatTime(progress.timeRemaining)}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                {isComplete ? 'Status' : 'Remaining'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transfer amount */}
            <div style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-muted)',
                padding: 'var(--space-sm)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
            }}>
                {formatBytes(progress.bytesTransferred)} / {formatBytes(progress.totalBytes)}
            </div>
        </div>
    );
}

import { ArrowUpCircle, ArrowDownCircle, Gauge } from 'lucide-react';

interface SessionStatsProps {
    bytesSent: number;
    bytesReceived: number;
    filesSent: number;
    filesReceived: number;
    isTransferring?: boolean;
    currentSpeed?: number;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bps: number): string {
    if (bps === 0) return '--';
    if (bps < 1024 * 1024) return (bps / 1024).toFixed(0) + ' KB/s';
    return (bps / (1024 * 1024)).toFixed(1) + ' MB/s';
}

export function SessionStats({
    bytesSent,
    bytesReceived,
    filesSent,
    filesReceived,
    isTransferring,
    currentSpeed
}: SessionStatsProps) {
    const totalBytes = bytesSent + bytesReceived;

    return (
        <div className="session-stats">
            <div className="session-stat">
                <div className="session-stat-icon sent">
                    <ArrowUpCircle size={18} />
                </div>
                <div className="session-stat-info">
                    <span className="session-stat-value">{filesSent}</span>
                    <span className="session-stat-label">Sent</span>
                </div>
            </div>

            <div className="session-stat">
                <div className="session-stat-icon received">
                    <ArrowDownCircle size={18} />
                </div>
                <div className="session-stat-info">
                    <span className="session-stat-value">{filesReceived}</span>
                    <span className="session-stat-label">Received</span>
                </div>
            </div>

            <div className="session-stat">
                <div className="session-stat-icon speed">
                    <Gauge size={18} />
                </div>
                <div className="session-stat-info">
                    <span className="session-stat-value">
                        {isTransferring ? formatSpeed(currentSpeed || 0) : formatBytes(totalBytes)}
                    </span>
                    <span className="session-stat-label">
                        {isTransferring ? 'Speed' : 'Total'}
                    </span>
                </div>
            </div>
        </div>
    );
}

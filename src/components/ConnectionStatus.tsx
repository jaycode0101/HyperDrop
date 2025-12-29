import { Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';

interface ConnectionStatusProps {
    status: 'idle' | 'connecting' | 'connected' | 'error';
    peerName?: string;
}

export function ConnectionStatus({ status, peerName }: ConnectionStatusProps) {
    return (
        <div className={`connection-status connection-status--${status}`}>
            <div className="connection-status-icon">
                {status === 'idle' && <WifiOff size={16} />}
                {status === 'connecting' && <Loader2 size={16} className="animate-spin" />}
                {status === 'connected' && <CheckCircle2 size={16} />}
                {status === 'error' && <WifiOff size={16} />}
            </div>
            <div className="connection-status-info">
                <span className="connection-status-label">
                    {status === 'idle' && 'Not connected'}
                    {status === 'connecting' && 'Connecting...'}
                    {status === 'connected' && 'Connected'}
                    {status === 'error' && 'Connection failed'}
                </span>
                {peerName && status === 'connected' && (
                    <span className="connection-status-peer">{peerName}</span>
                )}
            </div>
            {status === 'connected' && (
                <div className="connection-status-p2p">
                    <Wifi size={12} />
                    <span>P2P</span>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Users, MessageSquare, Download, Send, Clock, ChevronLeft, Trash2, File, Image, Video, Music, FileText, Archive } from 'lucide-react';
import type { PeerSession, FileRecord } from '../utils/storage';
import { getPeerSessions, getFilesForPeer, retrieveFile, deleteFile } from '../utils/storage';

// No props needed - HistoryTab is self-contained

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
    return File;
}

// Peer List View
function PeerList({
    sessions,
    onSelectPeer
}: {
    sessions: PeerSession[];
    onSelectPeer: (peer: PeerSession) => void;
}) {
    if (sessions.length === 0) {
        return (
            <div className="card-glass text-center" style={{ padding: 'var(--space-xl)' }}>
                <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)', opacity: 0.5 }} />
                <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    No Transfer History
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Your file transfers will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-sm">
            {sessions.map((peer) => (
                <div
                    key={peer.peerId}
                    className="card-glass card-interactive flex items-center gap-md"
                    style={{ padding: 'var(--space-md)' }}
                    onClick={() => onSelectPeer(peer)}
                >
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 'var(--font-size-lg)',
                    }}>
                        {peer.peerName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{peer.peerName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {peer.filesCount} file{peer.filesCount !== 1 ? 's' : ''} • {formatRelativeTime(peer.lastConnected)}
                        </div>
                    </div>

                    <MessageSquare size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
            ))}
        </div>
    );
}

// Conversation View (files from a peer)
function ConversationView({
    peer,
    files,
    onBack,
    onDownload,
    onDelete,
}: {
    peer: PeerSession;
    files: FileRecord[];
    onBack: () => void;
    onDownload: (file: FileRecord) => void;
    onDelete: (file: FileRecord) => void;
}) {
    return (
        <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Header */}
            <div className="flex items-center gap-md" style={{
                marginBottom: 'var(--space-lg)',
                paddingBottom: 'var(--space-md)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <button className="icon-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                }}>
                    {peer.peerName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: 600 }}>{peer.peerName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {files.length} file{files.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Files list - Chat style */}
            <div className="flex flex-col gap-sm" style={{ flex: 1, overflowY: 'auto' }}>
                {files.map((file) => {
                    const IconComponent = getFileIcon(file.type);
                    const isSent = file.direction === 'sent';

                    return (
                        <div
                            key={file.id}
                            className="animate-fadeIn"
                            style={{
                                display: 'flex',
                                justifyContent: isSent ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <div
                                className="card-glass"
                                style={{
                                    padding: 'var(--space-sm) var(--space-md)',
                                    maxWidth: '80%',
                                    background: isSent
                                        ? 'rgba(99, 102, 241, 0.15)'
                                        : 'var(--bg-tertiary)',
                                    borderRadius: isSent
                                        ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                                        : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                                }}
                            >
                                <div className="flex items-center gap-sm">
                                    <div className="file-type-icon" style={{ width: 36, height: 36 }}>
                                        <IconComponent size={18} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: 500,
                                            fontSize: 'var(--font-size-sm)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {formatFileSize(file.size)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-sm)' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                                        {formatRelativeTime(file.timestamp)}
                                    </div>
                                    <div className="flex gap-xs">
                                        {!isSent && (
                                            <button
                                                className="icon-btn"
                                                onClick={() => onDownload(file)}
                                                style={{ width: 28, height: 28 }}
                                                title="Download"
                                            >
                                                <Download size={14} />
                                            </button>
                                        )}
                                        <button
                                            className="icon-btn danger"
                                            onClick={() => onDelete(file)}
                                            style={{ width: 28, height: 28 }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Direction indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: 8,
                                    [isSent ? 'right' : 'left']: -20,
                                    color: isSent ? 'var(--primary)' : 'var(--success)',
                                }}>
                                    {isSent ? <Send size={12} /> : <Download size={12} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function HistoryTab() {
    const [sessions, setSessions] = useState<PeerSession[]>([]);
    const [selectedPeer, setSelectedPeer] = useState<PeerSession | null>(null);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Load peer sessions
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await getPeerSessions();
            setSessions(data);
        } catch (e) {
            console.error('Failed to load sessions:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPeer = async (peer: PeerSession) => {
        setSelectedPeer(peer);
        try {
            const peerFiles = await getFilesForPeer(peer.peerId);
            setFiles(peerFiles);
        } catch (e) {
            console.error('Failed to load files:', e);
        }
    };

    const handleBack = () => {
        setSelectedPeer(null);
        setFiles([]);
        loadSessions();
    };

    const handleDownload = async (file: FileRecord) => {
        try {
            const blob = await retrieveFile(file.id);
            if (!blob) {
                alert('File not found or could not be decrypted.');
                return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Failed to download:', e);
            alert('Failed to decrypt file.');
        }
    };

    const handleDelete = async (file: FileRecord) => {
        try {
            await deleteFile(file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (e) {
            console.error('Failed to delete:', e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ padding: 'var(--space-xl)' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (selectedPeer) {
        return (
            <ConversationView
                peer={selectedPeer}
                files={files}
                onBack={handleBack}
                onDownload={handleDownload}
                onDelete={handleDelete}
            />
        );
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
                <Users size={20} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>Transfer History</h2>
            </div>

            <PeerList sessions={sessions} onSelectPeer={handleSelectPeer} />
        </div>
    );
}

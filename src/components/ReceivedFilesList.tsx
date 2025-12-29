import { Download, Trash2, Image, Video, Music, FileText, Archive, File, Clock, Trash } from 'lucide-react';
import type { ReceivedFile } from '../types';

interface ReceivedFilesListProps {
    files: ReceivedFile[];
    onDownload: (file: ReceivedFile) => void;
    onDelete: (fileId: string) => void;
    onClearAll?: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
    return File;
}

export function ReceivedFilesList({ files, onDownload, onDelete, onClearAll }: ReceivedFilesListProps) {
    if (files.length === 0) {
        return (
            <div className="card-glass text-center" style={{ padding: 'var(--space-xl)' }}>
                <Download size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)', opacity: 0.5 }} />
                <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                    No Files Received
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Files you receive will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header with Clear All */}
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h3 style={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    fontSize: 'var(--font-size-sm)',
                }}>
                    <Clock size={16} style={{ opacity: 0.7 }} />
                    Recent Files ({files.length})
                </h3>

                {onClearAll && (
                    <button
                        className="btn btn-secondary"
                        onClick={onClearAll}
                        style={{
                            padding: '6px 12px',
                            fontSize: 'var(--font-size-xs)',
                            gap: '4px',
                        }}
                    >
                        <Trash size={14} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-sm" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {files.map((file, index) => {
                    const IconComponent = getFileIcon(file.type);
                    const hasBlob = !!file.blob;

                    return (
                        <div
                            key={file.id}
                            className="file-item animate-slideIn"
                            style={{
                                animationDelay: `${index * 50}ms`,
                                opacity: hasBlob ? 1 : 0.6,
                            }}
                        >
                            <div className="file-type-icon" style={{ width: 40, height: 40 }}>
                                <IconComponent size={20} />
                            </div>

                            <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
                                <div className="file-name" style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: 500,
                                    fontSize: 'var(--font-size-sm)',
                                }}>
                                    {file.name}
                                </div>
                                <div className="file-meta" style={{
                                    color: 'var(--text-muted)',
                                    fontSize: 'var(--font-size-xs)',
                                    display: 'flex',
                                    gap: 'var(--space-sm)',
                                }}>
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>•</span>
                                    <span>{formatRelativeTime(file.receivedAt)}</span>
                                    {!hasBlob && <span style={{ color: 'var(--warning)' }}>• Refresh lost</span>}
                                </div>
                            </div>

                            <div className="flex gap-xs">
                                <button
                                    className="icon-btn"
                                    onClick={() => onDownload(file)}
                                    title={hasBlob ? "Download" : "Not available"}
                                    disabled={!hasBlob}
                                    style={{
                                        color: hasBlob ? 'var(--primary)' : 'var(--text-muted)',
                                        width: 36,
                                        height: 36,
                                    }}
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    className="icon-btn danger"
                                    onClick={() => onDelete(file.id)}
                                    title="Delete"
                                    style={{ width: 36, height: 36 }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info banner about refresh */}
            <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--warning)',
                textAlign: 'center',
            }}>
                💡 Files are cleared on page refresh. Download to keep.
            </div>
        </div>
    );
}

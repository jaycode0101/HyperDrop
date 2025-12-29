import { useState, useRef, useCallback } from 'react';
import { Upload, Plus, X, Image, Video, Music, FileText, Archive, File as FileIcon } from 'lucide-react';
import type { FileInfo } from '../types';

interface FileSelectorProps {
    onFilesSelect: (files: FileInfo[]) => void;
    selectedFiles: FileInfo[];
    disabled?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) return Archive;
    return FileIcon;
}

export function FileSelector({ onFilesSelect, selectedFiles, disabled }: FileSelectorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: FileList, append: boolean = false) => {
        const newFileInfos: FileInfo[] = [];
        const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB max for preview

        Array.from(files).forEach((file, index) => {
            const fileInfo: FileInfo = {
                file,
                id: Math.random().toString(36).substring(2) + Date.now() + index,
            };

            // Only generate preview for small images (instant with createObjectURL)
            if (file.type.startsWith('image/') && file.size <= MAX_PREVIEW_SIZE) {
                fileInfo.preview = URL.createObjectURL(file);
            }

            newFileInfos.push(fileInfo);
        });

        // Append to existing or replace - immediate, no async
        onFilesSelect(append ? [...selectedFiles, ...newFileInfos] : newFileInfos);
    }, [onFilesSelect, selectedFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files, selectedFiles.length > 0);
        }
    }, [disabled, handleFiles, selectedFiles.length]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files, selectedFiles.length > 0);
        }
        e.target.value = '';
    };

    const removeFile = (id: string) => {
        onFilesSelect(selectedFiles.filter(f => f.id !== id));
    };

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);

    if (selectedFiles.length > 0) {
        return (
            <div className="animate-scaleIn">
                {/* Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                    </span>
                    <span className="status-badge" style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                    }}>
                        {formatFileSize(totalSize)}
                    </span>
                </div>

                {/* File list */}
                <div className="flex flex-col gap-sm" style={{ marginBottom: 'var(--space-md)', maxHeight: 200, overflowY: 'auto' }}>
                    {selectedFiles.map((fileInfo) => {
                        const IconComponent = getFileIcon(fileInfo.file.type);
                        return (
                            <div
                                key={fileInfo.id}
                                className="card-glass flex items-center gap-md animate-slideIn"
                                style={{ padding: 'var(--space-sm) var(--space-md)' }}
                            >
                                <div className="file-type-icon" style={{ width: 40, height: 40 }}>
                                    {fileInfo.preview ? (
                                        <img
                                            src={fileInfo.preview}
                                            alt="Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                                        />
                                    ) : (
                                        <IconComponent size={20} />
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 500,
                                        fontSize: 'var(--font-size-sm)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {fileInfo.file.name}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                                        {formatFileSize(fileInfo.file.size)}
                                    </div>
                                </div>

                                {!disabled && (
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => removeFile(fileInfo.id)}
                                        title="Remove"
                                        style={{ width: 32, height: 32 }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add more button */}
                {!disabled && (
                    <button className="btn btn-secondary w-full" onClick={handleClick}>
                        <Plus size={18} /> Add More Files
                    </button>
                )}

                <input ref={inputRef} type="file" multiple accept="*/*" onChange={handleChange} style={{ display: 'none' }} />
            </div>
        );
    }

    return (
        <div
            className={`drop-zone ${isDragging ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            style={{
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            <div style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)',
                boxShadow: 'var(--shadow-glow)',
            }}>
                <Upload size={32} color="white" />
            </div>
            <div className="drop-zone-text" style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                {isDragging ? 'Drop your files here!' : 'Drop files here'}
            </div>
            <div className="drop-zone-hint" style={{ marginTop: 'var(--space-xs)' }}>
                or tap to browse
            </div>
            <div style={{
                marginTop: 'var(--space-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: 'var(--space-lg)',
                justifyContent: 'center',
            }}>
                <span className="flex items-center gap-xs"><FileText size={14} /> Docs</span>
                <span className="flex items-center gap-xs"><Image size={14} /> Images</span>
                <span className="flex items-center gap-xs"><Video size={14} /> Videos</span>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleChange}
                style={{ display: 'none' }}
                disabled={disabled}
            />
        </div>
    );
}

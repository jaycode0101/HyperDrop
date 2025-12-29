import {
    Upload,
    Download,
    File,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    Folder,
    Link,
    Copy,
    Check,
    X,
    Trash2,
    Plus,
    ArrowRight,
    Zap,
    Shield,
    Wifi,
    WifiOff,
    RefreshCw,
    Clock,
    Send,
    Inbox,
    Lock,
    Loader2,
    type LucideIcon
} from 'lucide-react';

export {
    Upload as UploadIcon,
    Download as DownloadIcon,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    Music as MusicIcon,
    FileText as DocumentIcon,
    Archive as ArchiveIcon,
    Folder as FolderIcon,
    Link as LinkIcon,
    Copy as CopyIcon,
    Check as CheckIcon,
    X as CloseIcon,
    Trash2 as DeleteIcon,
    Plus as PlusIcon,
    ArrowRight as ArrowRightIcon,
    Zap as ZapIcon,
    Shield as ShieldIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    RefreshCw as RefreshIcon,
    Clock as ClockIcon,
    Send as SendIcon,
    Inbox as InboxIcon,
    Lock as LockIcon,
    Loader2 as LoaderIcon,
};

export type { LucideIcon };

// Get file type icon
export function getFileTypeIcon(mimeType: string): LucideIcon {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) return Archive;
    return File;
}

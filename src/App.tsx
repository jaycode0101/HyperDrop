import { useState, useCallback, useEffect } from 'react';
import {
    Send,
    Download,
    Zap,
    Copy,
    Check,
    Link,
    Plus,
    X,
    Clock
} from 'lucide-react';
import { useDeviceName } from './hooks/useDeviceName';
import { useTransfer } from './hooks/useTransfer';
import { DeviceSetup } from './components/DeviceSetup';
import { FileSelector } from './components/FileSelector';
import { TransferProgressDisplay } from './components/TransferProgress';
import { ReceivedFilesList } from './components/ReceivedFilesList';
import { LoadingSpinner, SuccessCheck, PulsingDot } from './components/LoadingSpinner';
import { EncryptionBanner } from './components/EncryptionBanner';
import { SessionStats } from './components/SessionStats';
import { HistoryTab } from './components/HistoryTab';
import { initStorage, storeFile } from './utils/storage';
import type { TabType, FileInfo, ReceivedFile, FileMetadata } from './types';

const RECEIVED_FILES_KEY = 'hyperdrop_received_files';

function App() {
    const { deviceName, deviceId, isLoading, isSetupComplete } = useDeviceName();
    const [showSetup, setShowSetup] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('send');
    const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
    const [transferMode, setTransferMode] = useState<'idle' | 'sending' | 'receiving'>('idle');
    const [peerIdInput, setPeerIdInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [storageReady, setStorageReady] = useState(false);

    // Session stats
    const [sessionStats, setSessionStats] = useState({
        bytesSent: 0,
        bytesReceived: 0,
        filesSent: 0,
        filesReceived: 0,
    });

    // Initialize encrypted storage
    useEffect(() => {
        if (deviceId) {
            initStorage(deviceId)
                .then(() => setStorageReady(true))
                .catch(e => console.error('Storage init failed:', e));
        }
    }, [deviceId]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECEIVED_FILES_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setReceivedFiles(parsed.map((f: ReceivedFile) => ({
                    ...f,
                    receivedAt: new Date(f.receivedAt),
                    blob: undefined
                })));
            }
        } catch (e) {
            console.error('Failed to load received files:', e);
        }
    }, []);

    useEffect(() => {
        const toSave = receivedFiles.map(f => ({
            ...f,
            blob: undefined
        }));
        localStorage.setItem(RECEIVED_FILES_KEY, JSON.stringify(toSave));
    }, [receivedFiles]);

    const handleFileReceived = useCallback((blob: Blob, metadata: FileMetadata, senderDeviceName: string) => {
        console.log('File received:', metadata.name, 'from', senderDeviceName);
        const fileId = metadata.id + '-' + Date.now();
        const newFile: ReceivedFile = {
            id: fileId,
            name: metadata.name,
            size: metadata.size,
            type: metadata.type,
            blob,
            receivedAt: new Date(),
            senderName: senderDeviceName || 'Unknown Device',
            transferSpeed: 0,
            transferTime: 0,
        };
        setReceivedFiles(prev => [newFile, ...prev]);

        // Store encrypted in IndexedDB
        if (storageReady) {
            storeFile(blob, {
                id: fileId,
                name: metadata.name,
                peerId: peerIdInput || 'unknown',
                peerName: senderDeviceName || 'Unknown Device',
                direction: 'received',
            }).catch(e => console.error('Failed to store file:', e));
        }

        // Update session stats
        setSessionStats(prev => ({
            ...prev,
            bytesReceived: prev.bytesReceived + metadata.size,
            filesReceived: prev.filesReceived + 1,
        }));
    }, [storageReady, peerIdInput]);

    const transfer = useTransfer({
        onFileReceived: handleFileReceived,
        onError: (error) => console.error('Transfer error:', error),
    });

    // Update sent stats when transfer completes
    useEffect(() => {
        if (transfer.progress.status === 'complete' && transferMode === 'sending') {
            const totalBytes = selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
            setSessionStats(prev => ({
                ...prev,
                bytesSent: prev.bytesSent + totalBytes,
                filesSent: prev.filesSent + selectedFiles.length,
            }));
        }
    }, [transfer.progress.status, transferMode, selectedFiles]);

    useEffect(() => {
        if (transfer.peerName && receivedFiles.length > 0) {
            setReceivedFiles(prev => prev.map(f => ({
                ...f,
                senderName: f.senderName === 'Sender' ? transfer.peerName : f.senderName,
                transferSpeed: f.transferSpeed === 0 ? transfer.progress.speedBps : f.transferSpeed,
            })));
        }
    }, [transfer.peerName, transfer.progress.speedBps]);

    useEffect(() => {
        if (!isLoading && !isSetupComplete) {
            setShowSetup(true);
        }
    }, [isLoading, isSetupComplete]);

    useEffect(() => {
        if (selectedFiles.length > 0 && activeTab === 'send' && !transfer.myPeerId) {
            transfer.initAsSender(deviceName || 'Unknown Device');
            setTransferMode('sending');
        }
    }, [selectedFiles, activeTab, deviceName, transfer.myPeerId]);

    useEffect(() => {
        if (transfer.isConnected && selectedFiles.length > 0 && transferMode === 'sending' && transfer.progress.status === 'pending') {
            const files = selectedFiles.map(sf => sf.file);
            transfer.sendFiles(files);
        }
    }, [transfer.isConnected, selectedFiles, transferMode, transfer.progress.status]);

    const handleSetupComplete = () => setShowSetup(false);

    const handleFilesSelect = (files: FileInfo[]) => {
        setSelectedFiles(files);
        if (files.length === 0) transfer.resetTransfer();
    };

    const handleCopyPeerId = async () => {
        if (transfer.myPeerId) {
            try {
                await navigator.clipboard.writeText(transfer.myPeerId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                const el = document.createElement('input');
                el.value = transfer.myPeerId;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const handleConnect = async () => {
        const peerId = peerIdInput.trim().toUpperCase();
        if (!peerId) return;
        setTransferMode('receiving');
        try {
            await transfer.connectToPeer(peerId, deviceName || 'Unknown Device');
        } catch (e) {
            console.error('Connection failed:', e);
            setTransferMode('idle');
        }
    };

    const handleDownload = (file: ReceivedFile) => {
        if (!file.blob) {
            alert('File data not available. Files are cleared on page refresh.');
            return;
        }
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteFile = (fileId: string) => {
        setReceivedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleClearAll = () => {
        setReceivedFiles([]);
        localStorage.removeItem(RECEIVED_FILES_KEY);
    };

    const handleNewTransfer = () => {
        setSelectedFiles([]);
        setTransferMode('idle');
        setPeerIdInput('');
        transfer.resetTransfer();
        transfer.cleanup();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '100vh' }}>
                <LoadingSpinner size={64} />
            </div>
        );
    }

    if (showSetup) {
        return <DeviceSetup onComplete={handleSetupComplete} />;
    }

    const isTransferring = transfer.progress.status === 'transferring';

    return (
        <div className="app-container">
            {/* Header */}
            <header style={{
                textAlign: 'center',
                marginBottom: 'var(--space-lg)',
                paddingTop: 'var(--space-md)'
            }}>
                <h1 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-sm)'
                }}>
                    <Zap size={28} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.5))' }} />
                    <span className="text-gradient">HyperDrop</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-xs)' }}>
                    {deviceName}
                </p>
            </header>

            {/* Encryption Banner */}
            <EncryptionBanner
                isConnected={transfer.isConnected}
                peerName={transfer.peerName}
            />

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
                <button
                    className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('send'); handleNewTransfer(); }}
                >
                    <Send size={18} /> Send
                </button>
                <button
                    className={`tab ${activeTab === 'receive' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('receive'); handleNewTransfer(); }}
                >
                    <Download size={18} /> Receive
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <Clock size={18} /> History
                </button>
            </div>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
                {activeTab === 'send' && (
                    <div className="animate-fadeIn">
                        {selectedFiles.length === 0 && transferMode === 'idle' && (
                            <FileSelector onFilesSelect={handleFilesSelect} selectedFiles={selectedFiles} />
                        )}

                        {selectedFiles.length > 0 && (
                            <div className="flex flex-col gap-lg">
                                <FileSelector
                                    onFilesSelect={handleFilesSelect}
                                    selectedFiles={selectedFiles}
                                    disabled={isTransferring}
                                />

                                {transfer.progress.status !== 'pending' && (
                                    <div>
                                        {transfer.totalFiles > 1 && (
                                            <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                File {transfer.filesCompleted + 1} of {transfer.totalFiles}: {transfer.currentFileName}
                                            </div>
                                        )}
                                        <TransferProgressDisplay
                                            progress={transfer.progress}
                                            peerName={transfer.peerName}
                                            fileName={transfer.currentFileName || selectedFiles[0]?.file.name || 'Unknown'}
                                            mode="sending"
                                            onCancel={handleNewTransfer}
                                        />
                                    </div>
                                )}

                                {transfer.progress.status === 'pending' && !transfer.isConnected && (
                                    <div className="card-glass animate-fadeIn" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                                        {!transfer.isPeerReady ? (
                                            <div className="flex flex-col items-center gap-md">
                                                <LoadingSpinner size={48} />
                                                <p style={{ color: 'var(--text-secondary)' }}>Creating secure connection...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-center gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
                                                    <PulsingDot color="var(--success)" size={10} />
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                        Ready for connection
                                                    </span>
                                                </div>

                                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)' }}>
                                                    Share this code with the receiver:
                                                </p>
                                                <div className="connection-code" style={{ marginBottom: 'var(--space-lg)' }}>
                                                    {transfer.myPeerId}
                                                </div>

                                                <button className="btn btn-primary w-full" onClick={handleCopyPeerId}>
                                                    {copied ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy Code</>}
                                                </button>

                                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-lg)' }}>
                                                    Receiver enters this code in the Receive tab
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {transfer.isConnected && transfer.progress.status === 'pending' && (
                                    <div className="card-glass text-center animate-fadeIn" style={{ padding: 'var(--space-xl)' }}>
                                        <Link size={48} style={{ color: 'var(--success)', marginBottom: 'var(--space-md)' }} />
                                        <p style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', color: 'var(--success)' }}>
                                            Connected to {transfer.peerName}!
                                        </p>
                                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                                            Starting transfer of {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                                        </p>
                                    </div>
                                )}

                                {transfer.connectionError && (
                                    <div className="card-glass" style={{ padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)' }}>
                                        <p style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <X size={20} /> {transfer.connectionError}
                                        </p>
                                    </div>
                                )}

                                {transfer.progress.status === 'complete' && (
                                    <div className="text-center">
                                        <SuccessCheck size={64} />
                                        <p style={{ color: 'var(--success)', marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                            {transfer.totalFiles} file{transfer.totalFiles > 1 ? 's' : ''} sent successfully!
                                        </p>
                                        <button className="btn btn-primary w-full" onClick={handleNewTransfer}>
                                            <Plus size={20} /> Send More Files
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'receive' && (
                    <div className="animate-fadeIn flex flex-col gap-lg">
                        {transferMode === 'idle' && (
                            <div className="card-glass" style={{ padding: 'var(--space-xl)' }}>
                                <div className="text-center" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <Download size={48} style={{ color: 'var(--primary)', marginBottom: 'var(--space-md)' }} />
                                    <h3 style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>Receive Files</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        Enter the sender's code to connect
                                    </p>
                                </div>

                                <input
                                    type="text"
                                    className="input"
                                    value={peerIdInput}
                                    onChange={(e) => setPeerIdInput(e.target.value.toUpperCase())}
                                    placeholder="HD-XXXXXX"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 'var(--font-size-xl)',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        marginBottom: 'var(--space-md)'
                                    }}
                                    maxLength={9}
                                />

                                <button className="btn btn-primary btn-lg w-full" onClick={handleConnect} disabled={peerIdInput.length < 8}>
                                    <Link size={20} /> Connect
                                </button>
                            </div>
                        )}

                        {transferMode === 'receiving' && !transfer.isConnected && transfer.progress.status === 'pending' && (
                            <div className="card-glass text-center" style={{ padding: 'var(--space-xl)' }}>
                                <LoadingSpinner size={48} />
                                <p style={{ fontWeight: 600, marginTop: 'var(--space-md)' }}>Connecting to {peerIdInput}...</p>
                                {transfer.connectionError && (
                                    <p style={{ color: 'var(--error)', marginTop: 'var(--space-md)' }}>{transfer.connectionError}</p>
                                )}
                            </div>
                        )}

                        {transfer.isConnected && transfer.progress.status === 'pending' && (
                            <div className="card-glass text-center" style={{ padding: 'var(--space-xl)' }}>
                                <SuccessCheck size={64} />
                                <p style={{ fontWeight: 600, color: 'var(--success)', marginTop: 'var(--space-md)' }}>
                                    Connected to {transfer.peerName}!
                                </p>
                                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                                    {transfer.totalFiles > 0
                                        ? `Receiving ${transfer.totalFiles} file${transfer.totalFiles > 1 ? 's' : ''}...`
                                        : 'Waiting for files...'}
                                </p>
                            </div>
                        )}

                        {transferMode === 'receiving' && transfer.progress.status !== 'pending' && (
                            <>
                                {transfer.totalFiles > 1 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        File {transfer.filesCompleted + 1} of {transfer.totalFiles}
                                    </div>
                                )}
                                <TransferProgressDisplay
                                    progress={transfer.progress}
                                    peerName={transfer.peerName}
                                    fileName={transfer.currentFileName || 'Receiving...'}
                                    mode="receiving"
                                    onCancel={handleNewTransfer}
                                />

                                {transfer.progress.status === 'complete' && (
                                    <div className="text-center">
                                        <SuccessCheck size={64} />
                                        <p style={{ color: 'var(--success)', marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                            {transfer.filesCompleted} file{transfer.filesCompleted > 1 ? 's' : ''} received!
                                        </p>
                                        <button className="btn btn-primary w-full" onClick={handleNewTransfer}>
                                            <Plus size={20} /> Receive More Files
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {transferMode === 'idle' && (
                            <ReceivedFilesList
                                files={receivedFiles}
                                onDownload={handleDownload}
                                onDelete={handleDeleteFile}
                                onClearAll={handleClearAll}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <HistoryTab />
                )}
            </main>

            {/* Footer - Session Stats */}
            <footer style={{
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border-color)',
            }}>
                <SessionStats
                    bytesSent={sessionStats.bytesSent}
                    bytesReceived={sessionStats.bytesReceived}
                    filesSent={sessionStats.filesSent}
                    filesReceived={sessionStats.filesReceived}
                    isTransferring={isTransferring}
                    currentSpeed={transfer.progress.speedBps}
                />
            </footer>
        </div>
    );
}

export default App;

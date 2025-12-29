import { Lock } from 'lucide-react';

interface EncryptionBannerProps {
    isConnected?: boolean;
    peerName?: string;
}

export function EncryptionBanner({ isConnected, peerName }: EncryptionBannerProps) {
    return (
        <div className="encryption-banner-whatsapp">
            <Lock size={12} />
            <span>
                {isConnected
                    ? `Messages to ${peerName || 'this device'} are end-to-end encrypted. Tap to learn more.`
                    : 'Messages and files are end-to-end encrypted. No one outside of this transfer can read them.'
                }
            </span>
        </div>
    );
}

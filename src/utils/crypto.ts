// Encryption utilities using Web Crypto API


// Generate a key from device ID (deterministic)
export async function deriveKey(deviceId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(deviceId.padEnd(32, '0').slice(0, 32)),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('HyperDropSalt2024'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt data
export async function encryptData(
    data: ArrayBuffer,
    key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );
    return { encrypted, iv };
}

// Decrypt data
export async function decryptData(
    encrypted: ArrayBuffer,
    iv: Uint8Array,
    key: CryptoKey
): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        encrypted
    );
}

// Encrypt a Blob
export async function encryptBlob(
    blob: Blob,
    key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array; type: string }> {
    const arrayBuffer = await blob.arrayBuffer();
    const { encrypted, iv } = await encryptData(arrayBuffer, key);
    return { encrypted, iv, type: blob.type };
}

// Decrypt to Blob
export async function decryptBlob(
    encrypted: ArrayBuffer,
    iv: Uint8Array,
    type: string,
    key: CryptoKey
): Promise<Blob> {
    const decrypted = await decryptData(encrypted, iv, key);
    return new Blob([decrypted], { type });
}

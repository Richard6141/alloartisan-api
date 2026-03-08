import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class CryptoService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32;
    private readonly ivLength = 16;
    private readonly authTagLength = 16;
    private readonly key: Buffer;

    constructor(private config: ConfigService) {
        const secret = this.config.getOrThrow<string>('MFA_ENCRYPTION_KEY');
        // Dériver une clé de 256 bits à partir du secret
        this.key = scryptSync(secret, 'mfa-salt', this.keyLength);
    }

    /**
     * Chiffre une chaîne de caractères avec AES-256-GCM
     * @returns Format: iv:authTag:encryptedData (en hex)
     */
    encrypt(plaintext: string): string {
        const iv = randomBytes(this.ivLength);
        const cipher = createCipheriv(this.algorithm, this.key, iv, {
            authTagLength: this.authTagLength,
        });

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encryptedData
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Déchiffre une chaîne chiffrée avec AES-256-GCM
     * @param ciphertext Format attendu: iv:authTag:encryptedData (en hex)
     * @returns Le texte déchiffré, ou null si le format n'est pas chiffré
     */
    decrypt(ciphertext: string): string | null {
        const parts = ciphertext.split(':');
        if (parts.length !== 3) {
            // Format non chiffré (ancien secret MFA en clair)
            return null;
        }

        const [ivHex, authTagHex, encryptedData] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(this.algorithm, this.key, iv, {
            authTagLength: this.authTagLength,
        });
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Vérifie si une chaîne est au format chiffré
     */
    isEncrypted(value: string): boolean {
        const parts = value.split(':');
        return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
    }
}

export enum OtpType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PHONE_VERIFICATION = 'PHONE_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
    TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
}

export interface OtpData {
    code: string; // Le code OTP (sera hashé avant stockage)
    userId: string;
    type: OtpType;
    attempts?: number;
    maxAttempts?: number;
}

export interface StoredOtpData {
    codeHash: string; // Code hashé
    userId: string;
    type: OtpType;
    attempts: number;
    maxAttempts: number;
    createdAt: number; // Timestamp
}

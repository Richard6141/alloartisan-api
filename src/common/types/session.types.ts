export interface SessionData {
    sessionId: string;
    userId: string;
    tokenHash: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: number;
    lastUsedAt: number;
}

export interface SessionInfo {
    sessionId: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    createdAt: Date;
    lastUsedAt: Date;
    isCurrent: boolean;
}

export interface CreateSessionInput {
    userId: string;
    refreshToken: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
}

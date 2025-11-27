import { ForbiddenException, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto, EnableMfaDto, VerifyMfaDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Tokens, LoginResponse } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService, EmailService, SessionService } from 'src/common/services';
import { OtpType, SessionInfo } from 'src/common/types';
import { EmailVerificationDto } from 'src/common/services/dto';
import { NewOtpCodeDTO } from 'src/common/services/dto/new-otp-code.dto';
import { LoginAttemptService } from './services/login-attempt.service';
import { Role, Statut } from 'src/generated/prisma';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

interface DeviceInfo {
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
        private emailService: EmailService,
        private sessionService: SessionService,
        private loginAttemptService: LoginAttemptService,
    ) { }

    // ==================== REGISTER ====================
    async register(dto: AuthDto, deviceInfo?: DeviceInfo): Promise<Tokens> {
        const hash = await argon.hash(dto.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                },
            });

            const tokens = await this.createSession(user.id, deviceInfo);

            setImmediate(() => {
                this.sendVerificationEmail(user.id, user.email).catch((error) => {
                    this.logger.error(`Failed to send verification email to ${user.email}`, error);
                });
            });

            return tokens;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }

    // ==================== LOGIN ====================
    async login(dto: AuthDto, deviceInfo?: DeviceInfo): Promise<LoginResponse> {
        const genericError = 'Email or password incorrect';

        const isLocked = await this.loginAttemptService.isLocked(dto.email);
        if (isLocked) {
            const remainingTime = await this.loginAttemptService.getRemainingLockTime(dto.email);
            throw new ForbiddenException(
                `Compte temporairement verrouillé. Réessayez dans ${remainingTime} secondes.`,
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || user.statut === Statut.BANNI || user.statut === Statut.SUSPENDU) {
            await this.loginAttemptService.recordFailedAttempt(dto.email);
            throw new ForbiddenException(genericError);
        }

        const passwordMatch = await argon.verify(user.passwordHash, dto.password);
        if (!passwordMatch) {
            const remainingAttempts = await this.loginAttemptService.recordFailedAttempt(dto.email);
            if (remainingAttempts === 0) {
                throw new ForbiddenException(
                    'Compte verrouillé pendant 15 minutes suite à trop de tentatives échouées.',
                );
            }
            throw new ForbiddenException(genericError);
        }

        if (!user.emailVerified || user.statut !== Statut.ACTIF) {
            this.sendAccountStatusEmail(user).catch((error) =>
                this.logger.error(`Failed to send account status email to ${user.email}`, error),
            );
            throw new ForbiddenException(genericError);
        }

        await this.loginAttemptService.resetAttempts(dto.email);

        // Vérifier si MFA est activé
        if (user.mfaEnabled && user.mfaSecret) {
            const mfaToken = await this.jwtService.signAsync(
                { sub: user.id, type: 'mfa_pending' },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 5, // 5 minutes
                },
            );
            return { mfa_required: true, mfa_token: mfaToken };
        }

        // Mettre à jour dernière connexion
        await this.prisma.user.update({
            where: { id: user.id },
            data: { derniereConnexion: new Date() },
        });

        return this.createSession(user.id, deviceInfo);
    }

    // ==================== VERIFY MFA LOGIN ====================
    async verifyMfaLogin(mfaToken: string, code: string, deviceInfo?: DeviceInfo): Promise<Tokens> {
        try {
            const payload = await this.jwtService.verifyAsync<{ sub: string; type: string }>(
                mfaToken,
                { secret: this.config.getOrThrow('JWT_ACCESS_SECRET') },
            );

            if (payload.type !== 'mfa_pending') {
                throw new ForbiddenException('Invalid MFA token');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.mfaSecret) {
                throw new ForbiddenException('Invalid MFA token');
            }

            const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
            if (!isValid) {
                throw new ForbiddenException('Invalid MFA code');
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: { derniereConnexion: new Date() },
            });

            return this.createSession(user.id, deviceInfo);
        } catch {
            throw new ForbiddenException('Invalid or expired MFA token');
        }
    }

    // ==================== LOGOUT ====================
    async logout(userId: string, sessionId: string): Promise<void> {
        await this.sessionService.revoke(userId, sessionId);
    }

    async logoutAll(userId: string): Promise<void> {
        await this.sessionService.revokeAll(userId);
    }

    async logoutAllExceptCurrent(userId: string, currentSessionId: string): Promise<void> {
        await this.sessionService.revokeAllExcept(userId, currentSessionId);
    }

    // ==================== REFRESH TOKENS ====================
    async refreshTokens(userId: string, sessionId: string, rt: string): Promise<Tokens> {
        const isValid = await this.sessionService.validate(userId, sessionId, rt);
        if (!isValid) {
            throw new ForbiddenException('Access Denied');
        }

        const tokens = await this.getTokens(userId, sessionId);
        await this.sessionService.updateToken(userId, sessionId, tokens.refresh_token);
        return tokens;
    }

    // ==================== SESSIONS ====================
    async getSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
        return this.sessionService.getUserSessions(userId, currentSessionId);
    }

    async revokeSession(userId: string, sessionId: string): Promise<void> {
        await this.sessionService.revoke(userId, sessionId);
    }

    // ==================== PASSWORD RESET ====================
    async forgotPassword(dto: ForgotPasswordDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // Toujours retourner le même message pour éviter l'énumération
        const successMessage = 'Si cet email existe, un code de réinitialisation a été envoyé.';

        if (!user) {
            return successMessage;
        }

        const otpExists = await this.otpService.exists(user.id, OtpType.PASSWORD_RESET);
        if (otpExists) {
            return successMessage;
        }

        const otp = await this.otpService.create(user.id, OtpType.PASSWORD_RESET);
        this.emailService.sendPasswordResetEmail(user.email, otp).catch((error) => {
            this.logger.error(`Failed to send password reset email to ${user.email}`, error);
        });

        return successMessage;
    }

    async resetPassword(dto: ResetPasswordDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new ForbiddenException('Code invalide ou expiré');
        }

        const isValid = await this.otpService.verify(user.id, OtpType.PASSWORD_RESET, dto.code);
        if (!isValid) {
            throw new ForbiddenException('Code invalide ou expiré');
        }

        const hash = await argon.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hash },
        });

        // Révoquer toutes les sessions existantes
        await this.sessionService.revokeAll(user.id);

        return 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.';
    }

    // ==================== MFA (TOTP) ====================
    async generateMfaSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled');
        }

        const secret = authenticator.generateSecret();
        const otpAuthUrl = authenticator.keyuri(user.email, 'AlloArtisan', secret);
        const qrCode = await QRCode.toDataURL(otpAuthUrl);

        // Stocker temporairement le secret (non activé)
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret },
        });

        return { secret, qrCode };
    }

    async enableMfa(userId: string, dto: EnableMfaDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaSecret) {
            throw new ForbiddenException('Please generate MFA secret first');
        }

        if (user.mfaEnabled) {
            throw new BadRequestException('MFA is already enabled');
        }

        const isValid = authenticator.verify({ token: dto.code, secret: user.mfaSecret });
        if (!isValid) {
            throw new ForbiddenException('Invalid MFA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });

        return 'MFA activé avec succès';
    }

    async disableMfa(userId: string, dto: VerifyMfaDto): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            throw new BadRequestException('MFA is not enabled');
        }

        const isValid = authenticator.verify({ token: dto.code, secret: user.mfaSecret });
        if (!isValid) {
            throw new ForbiddenException('Invalid MFA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null },
        });

        return 'MFA désactivé avec succès';
    }

    // ==================== EMAIL VERIFICATION ====================
    async verifyOtp(dto: EmailVerificationDto): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        const isValid = await this.otpService.verify(
            user.id,
            OtpType.EMAIL_VERIFICATION,
            String(dto.code),
        );

        if (isValid && user.role === Role.CLIENT) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    statut: Statut.ACTIF,
                },
            });
        } else {
            throw new ForbiddenException('Invalid OTP');
        }
    }

    async newOtpCode(dto: NewOtpCodeDTO): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        if (user.emailVerified) {
            throw new ForbiddenException('Email already verified');
        }

        const otpExists = await this.otpService.exists(user.id, OtpType.EMAIL_VERIFICATION);
        if (otpExists) {
            return 'Un code existe déjà. Veuillez vérifier votre boite mail ou patientez quelques minutes.';
        }

        this.sendVerificationEmail(user.id, user.email).catch((error) => {
            this.logger.error(`Failed to send OTP email to ${user.email}`, error);
        });

        return 'Veuillez consulter votre boite mail pour recevoir un nouveau code';
    }

    // ==================== PRIVATE HELPERS ====================
    private async createSession(userId: string, deviceInfo?: DeviceInfo): Promise<Tokens> {
        const tokens = await this.getTokens(userId, '');
        const sessionId = await this.sessionService.create({
            userId,
            refreshToken: tokens.refresh_token,
            ...deviceInfo,
        });

        // Regénérer les tokens avec le sessionId
        return this.getTokens(userId, sessionId);
    }

    private async getTokens(userId: string, sessionId: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, sid: sessionId },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 15, // 15 minutes
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, sid: sessionId },
                {
                    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                    expiresIn: 60 * 60 * 24 * 7, // 7 jours
                },
            ),
        ]);

        return {
            access_token: at,
            refresh_token: rt,
            session_id: sessionId,
        };
    }

    private async sendVerificationEmail(userId: string, email: string): Promise<void> {
        const otp = await this.otpService.create(userId, OtpType.EMAIL_VERIFICATION);
        const success = await this.emailService.sendVerificationEmail(email, otp);
        if (!success) {
            this.logger.error(`Failed to send verification email to ${email}`);
        }
    }

    private async sendAccountStatusEmail(user: {
        id: string;
        email: string;
        emailVerified: boolean;
        statut: Statut;
    }): Promise<void> {
        if (!user.emailVerified) {
            const otp = await this.otpService.create(user.id, OtpType.EMAIL_VERIFICATION);
            await this.emailService.sendVerificationEmail(user.email, otp);
        } else if (user.statut === Statut.EN_ATTENTE) {
            await this.emailService.sendAccountStatusEmail(user.email, 'not_verified');
        }
    }
}

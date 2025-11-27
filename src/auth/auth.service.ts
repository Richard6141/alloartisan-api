import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService, EmailService } from 'src/common/services';
import { OtpType } from 'src/common/types';
import { EmailVerificationDto } from 'src/common/services/dto';
import { NewOtpCodeDTO } from 'src/common/services/dto/new-otp-code.dto';
import { LoginAttemptService } from './services/login-attempt.service';
import { Role, Statut } from 'src/generated/prisma';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
        private emailService: EmailService,
        private loginAttemptService: LoginAttemptService,
    ) {}

    async register(dto: AuthDto): Promise<Tokens> {
        const hash = await argon.hash(dto.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                },
            });

            const tokens = await this.getTokens(user.id);
            await this.updateRtHash(user.id, tokens.refresh_token);

            // Envoyer l'email de vérification en arrière-plan avec retry automatique
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

    private async sendVerificationEmail(userId: string, email: string): Promise<void> {
        const otp = await this.otpService.create(userId, OtpType.EMAIL_VERIFICATION);
        const success = await this.emailService.sendVerificationEmail(email, otp);
        if (!success) {
            this.logger.error(`Failed to send verification email to ${email}`);
        }
    }

    async login(dto: AuthDto): Promise<Tokens> {
        // Message générique pour éviter l'énumération d'utilisateurs
        const genericError = 'Email or password incorrect';

        // 1. Vérifier si le compte est verrouillé
        const isLocked = await this.loginAttemptService.isLocked(dto.email);
        if (isLocked) {
            const remainingTime = await this.loginAttemptService.getRemainingLockTime(dto.email);
            throw new ForbiddenException(
                `Compte temporairement verrouillé. Réessayez dans ${remainingTime} secondes.`,
            );
        }

        // 2. Trouver l'utilisateur par email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        // 3. Si non trouvé ou banni/suspendu, enregistrer l'échec
        if (!user || user.statut === Statut.BANNI || user.statut === Statut.SUSPENDU) {
            await this.loginAttemptService.recordFailedAttempt(dto.email);
            throw new ForbiddenException(genericError);
        }

        // 4. Vérifier le mot de passe
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

        // 5. Vérifier si email vérifié ET statut actif (message générique pour éviter l'énumération)
        if (!user.emailVerified || user.statut !== Statut.ACTIF) {
            // Envoyer un email d'aide en arrière-plan (sans bloquer la réponse)
            this.sendAccountStatusEmail(user).catch(() => {});
            throw new ForbiddenException(genericError);
        }

        // 6. Login réussi → Reset le compteur de tentatives
        await this.loginAttemptService.resetAttempts(dto.email);

        // 7. Générer et retourner les tokens
        const tokens = await this.getTokens(user.id);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    private async sendAccountStatusEmail(user: {
        id: string;
        email: string;
        emailVerified: boolean;
        statut: Statut;
    }): Promise<void> {
        if (!user.emailVerified) {
            // Renvoyer un code OTP pour vérification
            const otp = await this.otpService.create(user.id, OtpType.EMAIL_VERIFICATION);
            await this.emailService.sendVerificationEmail(user.email, otp);
        } else if (user.statut === Statut.EN_ATTENTE) {
            await this.emailService.sendAccountStatusEmail(user.email, 'not_verified');
        }
    }

    async logout(userId: string) {
        await this.prisma.user.updateMany({
            where: {
                id: userId,
                hasheRt: {
                    not: null,
                },
            },
            data: {
                hasheRt: null,
            },
        });
    }

    async refreshTokens(userId: string, rt: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user || !user.hasheRt) {
            throw new ForbiddenException('Access Denied');
        }
        const rtMatches = await argon.verify(user.hasheRt, rt);
        if (!rtMatches) {
            throw new ForbiddenException('Access Denied');
        }
        const tokens = await this.getTokens(user.id);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    async getTokens(userId: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 15,
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                },
                {
                    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                    expiresIn: 60 * 60 * 24 * 7,
                },
            ),
        ]);
        return {
            access_token: at,
            refresh_token: rt,
        };
    }
    async updateRtHash(userId: string, rt: string): Promise<void> {
        const hash = await argon.hash(rt);
        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                hasheRt: hash,
            },
        });
    }

    async verifyOtp(dto: EmailVerificationDto): Promise<void> {
        //Vérifier si l'utilisateur existe
        const typeotp = OtpType.EMAIL_VERIFICATION;
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (!user) {
            throw new ForbiddenException('User not found');
        }
        //Vérifier si l'OTP
        const otp = await this.otpService.verify(user.id, typeotp, String(dto.code));
        if (otp && user.role === Role.CLIENT) {
            await this.prisma.user.update({
                where: {
                    id: user.id,
                },
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
            where: {
                email: dto.email,
            },
        });
        if (!user) {
            throw new ForbiddenException('User not found');
        }
        if (user.emailVerified) {
            throw new ForbiddenException('Email already verified');
        }
        const otpExists = await this.otpService.exists(user.id, OtpType.EMAIL_VERIFICATION);
        if (otpExists) {
            return 'Un code existe déjà. Veuillez vérifier votre boite mail ou patientez quelques minutes pour demander un nouveau';
        }

        // Envoyer l'email avec le nouveau code OTP
        this.sendVerificationEmail(user.id, user.email).catch((error) => {
            this.logger.error(`Failed to send OTP email to ${user.email}`, error);
        });

        return 'Veuillez consulter votre boite mail pour recevoir un nouveau code';
    }
}

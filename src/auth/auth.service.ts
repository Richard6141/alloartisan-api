import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from 'src/common/services';
import { OtpType } from 'src/common/types';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailVerificationDto } from 'src/common/services/dto';
import { NewOtpCodeDTO } from 'src/common/services/dto/new-otp-code.dto';
import { LoginAttemptService } from './services/login-attempt.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
        private readonly mailerService: MailerService,
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

            const tokens = await this.getTokens(user.id, user.email, user.role);
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
        await this.sendEmailWithRetry(
            email,
            'Vérification de votre email - Allo Artisan',
            this.getVerificationEmailHtml(otp),
        );
    }

    private async sendEmailWithRetry(
        to: string,
        subject: string,
        html: string,
        maxRetries: number = 3,
    ): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.mailerService.sendMail({ to, subject, html });
                this.logger.log(`Email sent to ${to} (attempt ${attempt})`);
                return;
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(
                    `Email to ${to} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`,
                );

                if (attempt < maxRetries) {
                    // Attendre avant de réessayer (délai exponentiel: 1s, 2s, 4s)
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        this.logger.error(`Failed to send email to ${to} after ${maxRetries} attempts`, lastError);
        throw lastError ?? new Error(`Failed to send email to ${to}`);
    }

    private getVerificationEmailHtml(otp: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Allo Artisan</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Vérification de votre email</h2>
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                                            Bienvenue sur Allo Artisan ! Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :
                                        </p>
                                        <div style="text-align: center; margin: 30px 0;">
                                            <div style="display: inline-block; padding: 20px 40px; background-color: #f0f7ff; border: 2px dashed #2563eb; border-radius: 8px;">
                                                <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${otp}</span>
                                            </div>
                                        </div>
                                        <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                                            Ce code expire dans <strong>10 minutes</strong>.
                                        </p>
                                        <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                            Si vous n'avez pas créé de compte sur Allo Artisan, vous pouvez ignorer cet email.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #999999; font-size: 12px;">
                                            © 2025 Allo Artisan. Tous droits réservés.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
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
        if (!user || user.statut === 'BANNI' || user.statut === 'SUSPENDU') {
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
        if (!user.emailVerified || user.statut !== 'ACTIF') {
            // Envoyer un email d'aide en arrière-plan (sans bloquer la réponse)
            this.sendAccountStatusEmail(user).catch(() => {});
            throw new ForbiddenException(genericError);
        }

        // 6. Login réussi → Reset le compteur de tentatives
        await this.loginAttemptService.resetAttempts(dto.email);

        // 7. Générer et retourner les tokens
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    private async sendAccountStatusEmail(user: {
        id: string;
        email: string;
        emailVerified: boolean;
        statut: string;
    }): Promise<void> {
        if (!user.emailVerified) {
            // Renvoyer un code OTP pour vérification
            const otp = await this.otpService.create(user.id, OtpType.EMAIL_VERIFICATION);
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Activez votre compte - Allo Artisan',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <tr>
                                            <td style="padding: 40px 40px 20px; text-align: center; background-color: #f59e0b; border-radius: 8px 8px 0 0;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Allo Artisan</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px;">
                                                <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Votre compte n'est pas encore activé</h2>
                                                <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                    Une tentative de connexion a été détectée sur votre compte. Pour vous connecter, veuillez d'abord vérifier votre adresse email avec le code ci-dessous :
                                                </p>
                                                <div style="text-align: center; margin: 30px 0;">
                                                    <div style="display: inline-block; padding: 20px 40px; background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px;">
                                                        <span style="font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 8px;">${otp}</span>
                                                    </div>
                                                </div>
                                                <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                                                    Ce code expire dans <strong>10 minutes</strong>.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                                    © 2025 Allo Artisan. Tous droits réservés.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `,
            });
        } else if (user.statut === 'EN_ATTENTE') {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Compte en attente de validation - Allo Artisan',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td align="center" style="padding: 40px 0;">
                                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <tr>
                                            <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Allo Artisan</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px;">
                                                <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Compte en attente de validation</h2>
                                                <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                    Une tentative de connexion a été détectée sur votre compte. Votre compte est actuellement en attente de validation par notre équipe.
                                                </p>
                                                <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                                                    Nous vous enverrons un email dès que votre compte sera activé. Merci de votre patience.
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                                    © 2025 Allo Artisan. Tous droits réservés.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `,
            });
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
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    async getTokens(userId: string, email: string, role: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
                },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 15,
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
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
        if (otp && user.role === 'CLIENT') {
            await this.prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    emailVerified: true,
                    statut: 'ACTIF',
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

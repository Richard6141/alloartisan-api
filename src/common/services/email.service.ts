import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY is not configured. Emails will not be sent.');
        }
        this.resend = new Resend(apiKey);
        this.fromEmail =
            this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    }

    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [to],
                subject,
                html,
            });

            if (error) {
                this.logger.error(`Failed to send email to ${to}: ${error.message}`);
                return false;
            }

            this.logger.log(`Email sent successfully to ${to} (ID: ${data?.id})`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            return false;
        }
    }

    async sendVerificationEmail(to: string, otpCode: string): Promise<boolean> {
        const subject = 'Vérification de votre compte AlloArtisan';
        const html = this.getVerificationEmailHtml(otpCode);
        return this.sendEmail(to, subject, html);
    }

    async sendAccountStatusEmail(to: string, status: 'locked' | 'not_verified'): Promise<boolean> {
        const subject =
            status === 'locked'
                ? 'Tentative de connexion - Compte verrouillé'
                : 'Tentative de connexion - Vérification requise';

        const html =
            status === 'locked'
                ? this.getAccountLockedEmailHtml()
                : this.getAccountNotVerifiedEmailHtml();

        return this.sendEmail(to, subject, html);
    }

    private getVerificationEmailHtml(otpCode: string): string {
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Vérification de votre compte</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Vérification de votre compte</h2><p style="margin: 0 0 20px 0; color: #555;">Bienvenue sur AlloArtisan ! Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">${otpCode}</div></td></tr></table><p style="color: #666; font-size: 14px; margin: 25px 0 10px 0;">Ce code expire dans <strong>10 minutes</strong>.</p><p style="color: #888; font-size: 13px; margin: 0;">Si vous n'avez pas créé de compte sur AlloArtisan, veuillez ignorer cet email.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} AlloArtisan. Tous droits réservés.</p></td></tr></table></body></html>`;
    }

    private getAccountLockedEmailHtml(): string {
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Compte verrouillé</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #e74c3c; margin: 0 0 20px 0; font-size: 22px;">Tentative de connexion détectée</h2><p style="margin: 0 0 15px 0; color: #555;">Nous avons détecté plusieurs tentatives de connexion échouées sur votre compte.</p><p style="margin: 0 0 15px 0; color: #555;">Par mesure de sécurité, votre compte a été temporairement verrouillé pendant <strong>15 minutes</strong>.</p><p style="margin: 0; color: #555;">Si vous n'êtes pas à l'origine de ces tentatives, nous vous recommandons de changer votre mot de passe dès que possible.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} AlloArtisan. Tous droits réservés.</p></td></tr></table></body></html>`;
    }

    private getAccountNotVerifiedEmailHtml(): string {
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Vérification requise</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #f39c12; margin: 0 0 20px 0; font-size: 22px;">Vérification de compte requise</h2><p style="margin: 0 0 15px 0; color: #555;">Une tentative de connexion a été effectuée sur votre compte, mais celui-ci n'est pas encore vérifié.</p><p style="margin: 0; color: #555;">Veuillez vérifier votre compte en utilisant le code OTP qui vous a été envoyé lors de votre inscription, ou demandez un nouveau code.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} AlloArtisan. Tous droits réservés.</p></td></tr></table></body></html>`;
    }

    async sendPasswordResetEmail(to: string, otpCode: string): Promise<boolean> {
        const subject = 'Réinitialisation de votre mot de passe AlloArtisan';
        const html = this.getPasswordResetEmailHtml(otpCode);
        return this.sendEmail(to, subject, html);
    }

    private getPasswordResetEmailHtml(otpCode: string): string {
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Réinitialisation du mot de passe</title></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;"><tr><td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;"><h1 style="color: white; margin: 0; font-size: 28px;">AlloArtisan</h1></td></tr><tr><td style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px;"><h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Réinitialisation du mot de passe</h2><p style="margin: 0 0 20px 0; color: #555;">Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code ci-dessous pour continuer :</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px 40px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">${otpCode}</div></td></tr></table><p style="color: #666; font-size: 14px; margin: 25px 0 10px 0;">Ce code expire dans <strong>10 minutes</strong>.</p><p style="color: #888; font-size: 13px; margin: 0;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe restera inchangé.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} AlloArtisan. Tous droits réservés.</p></td></tr></table></body></html>`;
    }
}

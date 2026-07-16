import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessagingGateway } from 'src/messaging/messaging.gateway';
import { CanalNotification, Prisma } from 'src/generated/prisma';
import { SendNotificationPayload } from './notification.types';
import { Resend } from 'resend';
import { PushService } from 'src/push/push.service';
import { GetNotificationsDto } from './dto';

@Injectable()
export class NotificationService implements OnModuleInit {
    private readonly logger = new Logger(NotificationService.name);
    private resend: Resend;
    private readonly notificationExpiryDays: number;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly messagingGateway: MessagingGateway,
        private readonly push: PushService,
    ) {
        this.notificationExpiryDays = config.get<number>('NOTIFICATION_EXPIRY_DAYS', 30);
    }

    // ============================================================
    // INITIALISATION — Resend (email). Le push FCM vit dans PushService.
    // ============================================================

    onModuleInit() {
        this.initResend();
    }

    private initResend(): void {
        const apiKey = this.config.get<string>('RESEND_API_KEY');
        if (!apiKey || apiKey === 're_xxxxxxxxxxxxxxxxxxxx') {
            this.logger.warn('Resend API key non configurée — emails désactivés');
            return;
        }
        this.resend = new Resend(apiKey);
        this.logger.log('✅ Resend initialisé');
    }

    // ============================================================
    // API PRINCIPALE — Créer + Envoyer une notification
    // ============================================================

    /**
     * Point d'entrée unique pour envoyer une notification.
     * Crée automatiquement la notif en BDD + tente l'envoi push/email.
     */
    async send(payload: SendNotificationPayload): Promise<void> {
        try {
            // 1. Calculer la date d'expiration
            const expiresAt =
                payload.expiresAt ??
                new Date(Date.now() + this.notificationExpiryDays * 24 * 60 * 60 * 1000);

            // 2. Persister en BDD (in-app notification)
            const notification = await this.prisma.notification.create({
                data: {
                    userId: payload.userId,
                    type: payload.type,
                    canal: payload.canal ?? CanalNotification.IN_APP,
                    titre: payload.titre.substring(0, 200),
                    corps: payload.corps,
                    data: (payload.data ?? {}) as Prisma.InputJsonValue,
                    expiresAt,
                },
            });

            // 2b. Pousser en TEMPS RÉEL au destinataire connecté (WebSocket) :
            // badges, listes et écrans se mettent à jour instantanément
            try {
                this.messagingGateway.emitToUser(payload.userId, 'notification:new', {
                    id: notification.id,
                    type: notification.type,
                    titre: notification.titre,
                    corps: notification.corps,
                    data: notification.data,
                    lu: false,
                    createdAt: notification.createdAt,
                });
            } catch {
                // Gateway pas encore initialisée (tests) : non bloquant
            }

            // 3. Tenter l'envoi push FCM (PushService no-op si non configuré)
            await this.push.sendToUser(payload.userId, payload.titre, payload.corps, payload.data);
        } catch (error) {
            // Ne jamais bloquer le flux métier pour une notif ratée
            this.logger.error(
                `Erreur envoi notification userId=${payload.userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Envoie UNIQUEMENT un push (sans créer de notification in-app en BDD).
     * Pensé pour la messagerie : on veut faire sonner le téléphone quand un
     * message arrive app fermée, mais SANS polluer la cloche de notifications
     * (le chat a déjà son propre badge « non lus »).
     */
    async pushOnly(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, unknown>,
    ): Promise<void> {
        await this.push.sendToUser(userId, title, body, data);
    }

    // ============================================================
    // EMAIL — Fallback via Resend
    // ============================================================

    async sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
        if (!this.resend) {
            this.logger.warn('Email ignoré : Resend non configuré');
            return;
        }

        try {
            const fromEmail =
                this.config.get<string>('RESEND_FROM_EMAIL') ||
                'AlloArtisan <noreply@alloartisan.bj>';

            await this.resend.emails.send({
                from: fromEmail,
                to: params.to,
                subject: params.subject,
                html: params.html,
            });

            this.logger.debug(`Email envoyé à ${params.to} | Objet: ${params.subject}`);
        } catch (error) {
            this.logger.error(
                `Erreur envoi email à ${params.to}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    // ============================================================
    // GESTION TOKENS FCM
    // ============================================================

    async registerFcmToken(userId: string, token: string, deviceName?: string): Promise<void> {
        // Upsert : si le token existe déjà (même device), on le réactive
        await this.prisma.fcmToken.upsert({
            where: { token },
            create: {
                userId,
                token,
                deviceName,
                actif: true,
            },
            update: {
                userId,
                deviceName,
                actif: true,
                updatedAt: new Date(),
            },
        });

        this.logger.debug(
            `Token FCM enregistré pour userId=${userId} | device=${deviceName ?? 'inconnu'}`,
        );
    }

    async deleteFcmToken(userId: string, token: string): Promise<void> {
        await this.prisma.fcmToken.updateMany({
            where: { userId, token },
            data: { actif: false },
        });
    }

    // ============================================================
    // NOTIFICATIONS IN-APP — Endpoints REST
    // ============================================================

    async getMyNotifications(userId: string, dto: GetNotificationsDto) {
        const page = Math.max(1, dto.page ?? 1);
        const limit = Math.min(50, Math.max(1, dto.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: any = {
            userId,
            // Exclure les notifications expirées
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        };

        if (dto.lu !== undefined) {
            where.lu = dto.lu;
        }

        const [notifications, total, unreadCount] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    type: true,
                    canal: true,
                    titre: true,
                    corps: true,
                    data: true,
                    lu: true,
                    luAt: true,
                    createdAt: true,
                    expiresAt: true,
                },
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({
                where: {
                    userId,
                    lu: false,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
            }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        };
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: { id: notificationId, userId, lu: false },
            data: { lu: true, luAt: new Date() },
        });
    }

    async markAllAsRead(userId: string): Promise<{ count: number }> {
        const result = await this.prisma.notification.updateMany({
            where: { userId, lu: false },
            data: { lu: true, luAt: new Date() },
        });
        return { count: result.count };
    }

    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                lu: false,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
        return { count };
    }

    // ============================================================
    // SCHEDULER — Nettoyage des notifications expirées
    // ============================================================

    async deleteExpiredNotifications(): Promise<number> {
        const result = await this.prisma.notification.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });

        if (result.count > 0) {
            this.logger.log(`Scheduler: ${result.count} notification(s) expirée(s) supprimées`);
        }

        return result.count;
    }

    /**
     * Purge les notifications DÉJÀ LUES au-delà de N jours : elles ont rempli
     * leur rôle, inutile de les garder jusqu'à l'expiration (30 j). Gros levier
     * d'allègement (les notifs lues sont l'essentiel du volume).
     */
    async purgeReadNotifications(): Promise<number> {
        const days = this.config.get<number>('NOTIFICATION_READ_RETENTION_DAYS', 10);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const result = await this.prisma.notification.deleteMany({
            where: { lu: true, createdAt: { lt: cutoff } },
        });
        if (result.count > 0) {
            this.logger.log(
                `Scheduler: ${result.count} notification(s) lue(s) purgée(s) (> ${days} j)`,
            );
        }
        return result.count;
    }

    /**
     * Plafond DUR par utilisateur : ne conserve que les `max` notifications les
     * plus récentes de chaque utilisateur, supprime le reste. Empêche un
     * utilisateur très actif de faire gonfler la table indéfiniment.
     */
    async capNotificationsPerUser(): Promise<number> {
        const max = this.config.get<number>('NOTIFICATION_MAX_PER_USER', 300);
        const deleted = await this.prisma.$executeRaw(Prisma.sql`
            DELETE FROM notifications n
            USING (
                SELECT id FROM (
                    SELECT id, row_number() OVER (
                        PARTITION BY user_id ORDER BY created_at DESC
                    ) AS rn
                    FROM notifications
                ) ranked
                WHERE ranked.rn > ${max}
            ) old
            WHERE n.id = old.id
        `);
        if (deleted > 0) {
            this.logger.log(
                `Scheduler: ${deleted} notification(s) au-delà du plafond (${max}/utilisateur) supprimées`,
            );
        }
        return deleted;
    }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CanalNotification, Prisma } from 'src/generated/prisma';
import { SendNotificationPayload } from './notification.types';
import { Resend } from 'resend';
import * as admin from 'firebase-admin';
import { GetNotificationsDto } from './dto';

@Injectable()
export class NotificationService implements OnModuleInit {
    private readonly logger = new Logger(NotificationService.name);
    private resend: Resend;
    private firebaseInitialized = false;
    private readonly notificationExpiryDays: number;
    private readonly pushRateLimit: number;
    private readonly pushRateWindow: number; // secondes

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.notificationExpiryDays = config.get<number>('NOTIFICATION_EXPIRY_DAYS', 30);
        this.pushRateLimit = config.get<number>('NOTIFICATION_PUSH_RATE_LIMIT', 10);
        this.pushRateWindow = config.get<number>('NOTIFICATION_PUSH_RATE_WINDOW', 3600); // 1h
    }

    // ============================================================
    // INITIALISATION — Firebase Admin SDK (lazy + safe)
    // ============================================================

    onModuleInit() {
        this.initResend();
        this.initFirebase();
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

    private initFirebase(): void {
        const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

        if (!projectId || projectId === 'your-firebase-project-id' || !clientEmail || !privateKey) {
            this.logger.warn(
                'Firebase non configuré — notifications push désactivées. Configurez FIREBASE_* dans .env',
            );
            return;
        }

        // Initialiser seulement si pas déjà fait (éviter double init en dev hot-reload)
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    // Les "\n" sont stockés comme "\n" dans .env, faut les convertir
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        }

        this.firebaseInitialized = true;
        this.logger.log('✅ Firebase Admin SDK initialisé');
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
            await this.prisma.notification.create({
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

            // 3. Tenter l'envoi push FCM (si Firebase configuré + tokens disponibles)
            if (this.firebaseInitialized) {
                await this.sendPushNotification(
                    payload.userId,
                    payload.titre,
                    payload.corps,
                    payload.data,
                );
            }
        } catch (error) {
            // Ne jamais bloquer le flux métier pour une notif ratée
            this.logger.error(
                `Erreur envoi notification userId=${payload.userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    // ============================================================
    // FCM PUSH — Envoi Firebase Cloud Messaging
    // ============================================================

    private async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, unknown>,
    ): Promise<void> {
        // Récupérer tous les tokens actifs de l'utilisateur
        const tokens = await this.prisma.fcmToken.findMany({
            where: { userId, actif: true },
            select: { token: true, id: true },
        });

        if (tokens.length === 0) return;

        const tokenStrings = tokens.map((t) => t.token);

        // Convertir data en Record<string, string> (requis par FCM)
        const fcmData: Record<string, string> = {};
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                fcmData[key] = String(value);
            }
        }

        try {
            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokenStrings,
                notification: { title, body },
                data: fcmData,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'alloartisan-notifications',
                    },
                },
                apns: {
                    payload: {
                        aps: { sound: 'default', badge: 1 },
                    },
                },
            });

            // Désactiver les tokens invalides (expired, not registered)
            const invalidTokenIds: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (
                    !resp.success &&
                    (resp.error?.code === 'messaging/registration-token-not-registered' ||
                        resp.error?.code === 'messaging/invalid-registration-token')
                ) {
                    invalidTokenIds.push(tokens[idx].id);
                }
            });

            if (invalidTokenIds.length > 0) {
                await this.prisma.fcmToken.updateMany({
                    where: { id: { in: invalidTokenIds } },
                    data: { actif: false },
                });
                this.logger.log(`${invalidTokenIds.length} token(s) FCM invalide(s) désactivés`);
            }

            const successCount = response.responses.filter((r) => r.success).length;
            this.logger.debug(
                `Push envoyé: ${successCount}/${tokenStrings.length} succès | userId=${userId}`,
            );
        } catch (error) {
            this.logger.error(
                `Erreur FCM multicast userId=${userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
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
}

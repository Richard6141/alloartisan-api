import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import * as admin from 'firebase-admin';

/**
 * PushService — envoi de notifications push via Firebase Cloud Messaging.
 *
 * Extrait de NotificationService pour être partagé SANS dépendance circulaire :
 * - NotificationService s'en sert pour les notifs métier (mission, avis…)
 * - MessagingService s'en sert pour faire sonner un message app fermée.
 *
 * PushModule ne dépend que de Prisma/Config → aucun cycle.
 */
@Injectable()
export class PushService implements OnModuleInit {
    private readonly logger = new Logger(PushService.name);
    private firebaseInitialized = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {}

    onModuleInit() {
        this.initFirebase();
    }

    private initFirebase(): void {
        const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.resolvePrivateKey();

        if (!projectId || projectId === 'your-firebase-project-id' || !clientEmail || !privateKey) {
            this.logger.warn(
                'Firebase non configuré — notifications push désactivées. Configurez FIREBASE_* dans .env',
            );
            return;
        }

        // Un défaut de clé ne doit JAMAIS faire tomber l'API : on isole l'init.
        try {
            if (admin.apps.length === 0) {
                admin.initializeApp({
                    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                });
            }
            this.firebaseInitialized = true;
            this.logger.log('✅ Firebase Admin SDK initialisé');
        } catch (error) {
            this.logger.error(
                `Firebase init échouée — push désactivé (l'API reste opérationnelle): ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Récupère la clé privée PEM. Priorité à FIREBASE_PRIVATE_KEY_B64 (base64,
     * une seule ligne sans caractères spéciaux — robuste à tous les parseurs
     * .env / fins de ligne). Repli sur FIREBASE_PRIVATE_KEY avec conversion \n.
     */
    private resolvePrivateKey(): string | undefined {
        const b64 = this.config.get<string>('FIREBASE_PRIVATE_KEY_B64');
        if (b64) {
            try {
                return Buffer.from(b64, 'base64').toString('utf8');
            } catch {
                return undefined;
            }
        }
        const raw = this.config.get<string>('FIREBASE_PRIVATE_KEY');
        return raw ? raw.replace(/\\n/g, '\n') : undefined;
    }

    /** true si Firebase est configuré (sinon les envois sont ignorés silencieusement). */
    get isConfigured(): boolean {
        return this.firebaseInitialized;
    }

    /**
     * Envoie un push à TOUS les appareils actifs d'un utilisateur.
     * No-op si Firebase n'est pas configuré ou si aucun token. Ne lève jamais.
     */
    async sendToUser(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, unknown>,
    ): Promise<void> {
        if (!this.firebaseInitialized) return;

        const tokens = await this.prisma.fcmToken.findMany({
            where: { userId, actif: true },
            select: { token: true, id: true },
        });
        if (tokens.length === 0) return;

        const tokenStrings = tokens.map((t) => t.token);

        // FCM exige des data en Record<string, string>
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
}

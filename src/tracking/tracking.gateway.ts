import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from './tracking.service';
import { buildWsOriginValidator } from 'src/common/utils/cors.util';
import type { PhaseUpdatePayload, PositionUpdatePayload } from './tracking.types';

/**
 * Gateway WebSocket pour le suivi temps réel des artisans.
 *
 * Namespace : /tracking
 * Transport : websocket avec fallback polling
 *
 * Authentification : JWT dans handshake.auth.token (comme /chat)
 *
 * Événements CLIENT → SERVEUR :
 *   subscribe_tracking    { bookingId }                       — client OU artisan : rejoint le suivi
 *   unsubscribe_tracking  { bookingId }
 *   position_update       { bookingId, latitude, longitude, heading?, speed?, accuracy? } — artisan
 *   phase_update          { bookingId, phase }                — artisan : EN_ROUTE | ARRIVE | EN_INTERVENTION | TERMINE
 *
 * Événements SERVEUR → CLIENT :
 *   tracking:state        état complet (envoyé à la souscription)
 *   tracking:position     position live + distance + ETA
 *   tracking:phase        { bookingId, phase }
 *   error                 { message }
 */
@WebSocketGateway({
    namespace: '/tracking',
    cors: {
        // Comparaison stricte d'origine (pas de startsWith — bypass par sous-domaine)
        origin: buildWsOriginValidator(),
        credentials: true,
    },
    transports: ['websocket', 'polling'],
})
@Injectable()
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TrackingGateway.name);

    constructor(
        private readonly trackingService: TrackingService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    afterInit() {
        this.logger.log('TrackingGateway initialisé — namespace /tracking');
    }

    // ─── Connexion / Déconnexion ──────────────────────────────────────────────

    async handleConnection(client: Socket) {
        try {
            const user = await this.authenticateSocket(client);
            client.data.userId = user.sub;
            client.data.role = user.role;
            this.logger.log(`Tracking connecté: [user:${user.sub}] [socket:${client.id}]`);
        } catch {
            this.logger.warn(`Connexion tracking refusée : token invalide [socket:${client.id}]`);
            client.emit('error', { message: 'Authentification échouée. Connexion fermée.' });
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Tracking déconnecté: [socket:${client.id}]`);
    }

    // ─── Souscription au suivi ────────────────────────────────────────────────

    @SubscribeMessage('subscribe_tracking')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { bookingId: string },
    ) {
        try {
            const userId = this.requireUserId(client);
            const state = await this.trackingService.getTrackingState(payload.bookingId, userId);

            await client.join(`tracking:${payload.bookingId}`);
            client.emit('tracking:state', state);

            return { success: true };
        } catch (err) {
            this.emitError(client, err);
            return { success: false };
        }
    }

    @SubscribeMessage('unsubscribe_tracking')
    async handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { bookingId: string },
    ) {
        await client.leave(`tracking:${payload.bookingId}`);
        return { success: true };
    }

    // ─── Mise à jour de position (artisan) ────────────────────────────────────

    @SubscribeMessage('position_update')
    async handlePositionUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: PositionUpdatePayload,
    ) {
        try {
            const userId = this.requireUserId(client);
            const position = await this.trackingService.updatePosition(userId, payload);

            // null = update ignorée (anti-flood) — pas d'erreur, on répond simplement throttled
            if (!position) return { success: true, throttled: true };

            this.server.to(`tracking:${payload.bookingId}`).emit('tracking:position', position);
            return { success: true };
        } catch (err) {
            this.emitError(client, err);
            return { success: false };
        }
    }

    // ─── Changement de phase (artisan) ────────────────────────────────────────

    @SubscribeMessage('phase_update')
    async handlePhaseUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: PhaseUpdatePayload,
    ) {
        try {
            const userId = this.requireUserId(client);
            const state = await this.trackingService.setPhase(
                userId,
                payload.bookingId,
                payload.phase,
            );

            this.server.to(`tracking:${payload.bookingId}`).emit('tracking:phase', {
                bookingId: payload.bookingId,
                phase: state.phase,
            });
            return { success: true };
        } catch (err) {
            this.emitError(client, err);
            return { success: false };
        }
    }

    // ─── Helpers privés ──────────────────────────────────────────────────────

    private async authenticateSocket(client: Socket): Promise<{ sub: string; role: string }> {
        const rawToken =
            (client.handshake.auth as Record<string, unknown>)?.token ??
            client.handshake.query?.token;
        const token = typeof rawToken === 'string' ? rawToken : undefined;

        if (!token) throw new WsException('Token manquant');

        try {
            return await this.jwtService.verifyAsync<{ sub: string; role: string }>(token, {
                secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
            });
        } catch {
            throw new WsException('Token invalide ou expiré');
        }
    }

    private requireUserId(client: Socket): string {
        const userId = (client.data as { userId?: string }).userId;
        if (!userId) throw new WsException('Non authentifié');
        return userId;
    }

    private emitError(client: Socket, err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne';
        this.logger.error(`Tracking WebSocket error: ${message}`);
        client.emit('error', { message });
    }
}

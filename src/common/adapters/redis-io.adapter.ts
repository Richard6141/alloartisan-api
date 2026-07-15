import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

/**
 * RedisIoAdapter — Scalabilité horizontale des WebSockets.
 *
 * Sans cet adapter, les événements Socket.io (chat, tracking) ne sont diffusés
 * qu'aux clients connectés à LA MÊME instance Node. Dès qu'on lance plusieurs
 * instances derrière un load balancer (montée en charge), les messages se
 * perdent entre instances.
 *
 * Avec l'adapter Redis pub/sub, toutes les instances partagent les rooms :
 * on peut scaler à N serveurs sans rien changer au code des gateways.
 *
 * Résilience : si Redis est injoignable au démarrage, on retombe sur
 * l'adapter mémoire (mono-instance) avec un warning — l'API ne crash pas.
 */
export class RedisIoAdapter extends IoAdapter {
    private readonly logger = new Logger(RedisIoAdapter.name);
    private adapterConstructor?: ReturnType<typeof createAdapter>;

    constructor(app: INestApplication) {
        super(app);
    }

    async connectToRedis(redisUrl: string): Promise<void> {
        try {
            const pubClient = createClient({
                url: redisUrl,
                // PING périodique + keepAlive : évite les ECONNRESET des
                // connexions inactives (Windows/Docker)
                pingInterval: 60000,
                socket: {
                    keepAlive: true,
                    reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000),
                },
            });
            const subClient = pubClient.duplicate();

            pubClient.on('error', (err) =>
                this.logger.error(`Redis pub client error: ${err.message}`),
            );
            subClient.on('error', (err) =>
                this.logger.error(`Redis sub client error: ${err.message}`),
            );

            await Promise.all([pubClient.connect(), subClient.connect()]);
            this.adapterConstructor = createAdapter(pubClient, subClient);
            this.logger.log(
                '✅ Socket.io Redis adapter connecté — WebSockets scalables multi-instances',
            );
        } catch (error) {
            this.logger.warn(
                `Redis adapter indisponible (${error instanceof Error ? error.message : String(error)}) — ` +
                    'fallback adapter mémoire (mono-instance uniquement)',
            );
        }
    }

    createIOServer(port: number, options?: ServerOptions) {
        const server = super.createIOServer(port, options);
        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }
        return server;
    }
}

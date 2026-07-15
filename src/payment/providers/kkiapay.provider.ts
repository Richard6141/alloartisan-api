import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface KkiaPayInitResult {
    transactionId: string;
    status: string;
    message?: string;
}

export interface KkiaPayTransaction {
    transactionId: string;
    status: string; // SUCCESS | FAILED | PENDING | TRANSACTION_NOT_FOUND
    amount: number;
    reference?: string;
}

/**
 * Provider KkiaPay — Mobile Money (Bénin).
 *
 * ARCHITECTURE RÉELLE DE KKIAPAY : l'initiation d'un paiement se fait
 * OBLIGATOIREMENT via leur widget côté client (k.js dans une WebView).
 * Le serveur ne peut que VÉRIFIER une transaction (et rembourser) avec les
 * trois clés (x-api-key / x-private-key / x-secret-key).
 *
 * Hôtes vérifiés : https://api-sandbox.kkiapay.me (sandbox, testé) et
 * https://api.kkiapay.me (production).
 */
@Injectable()
export class KkiaPayProvider {
    private readonly logger = new Logger(KkiaPayProvider.name);
    private readonly client: AxiosInstance;
    private readonly publicKey: string;
    private readonly sandbox: boolean;

    constructor(private readonly config: ConfigService) {
        this.publicKey = config.get<string>('KKIAPAY_PUBLIC_KEY', '');
        const privateKey = config.get<string>('KKIAPAY_PRIVATE_KEY', '');
        const secretKey = config.get<string>('KKIAPAY_SECRET_KEY', '');
        this.sandbox = config.get<string>('KKIAPAY_SANDBOX', 'true') === 'true';

        const baseURL = this.sandbox
            ? 'https://api-sandbox.kkiapay.me'
            : 'https://api.kkiapay.me';

        this.client = axios.create({
            baseURL,
            headers: {
                'x-api-key': this.publicKey,
                'x-private-key': privateKey,
                'x-secret-key': secretKey,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        });

        this.logger.log(`✅ KkiaPay initialisé — sandbox: ${this.sandbox}`);
    }

    /** Configuration à transmettre au widget côté app (clé PUBLIQUE seulement) */
    getWidgetConfig(): { publicKey: string; sandbox: boolean } {
        return { publicKey: this.publicKey, sandbox: this.sandbox };
    }

    /**
     * @deprecated KkiaPay n'expose PAS d'API REST d'initiation de paiement :
     * le paiement démarre dans le widget côté client, puis le serveur vérifie
     * la transaction. Conservé pour compatibilité avec l'ancien flux mission.
     */
    initiatePayment(_params: {
        montant: number;
        phoneNumber: string;
        name: string;
        referenceInterne: string;
        successUrl?: string;
    }): Promise<KkiaPayInitResult> {
        return Promise.reject(
            new BadRequestException(
                'Le paiement KkiaPay démarre dans l\'application (widget), pas côté serveur.',
            ),
        );
    }

    /**
     * Vérifier le statut d'un paiement KkiaPay (endpoint officiel testé).
     * POST /api/v1/transactions/status — répond 400 {status: TRANSACTION_NOT_FOUND}
     * pour un id inconnu.
     */
    async getTransactionStatus(transactionId: string): Promise<KkiaPayTransaction> {
        try {
            const response = await this.client.post('/api/v1/transactions/status', {
                transactionId,
            });
            const data = response.data ?? {};
            return {
                transactionId,
                status: String(data.status ?? 'PENDING'),
                amount: Number(data.amount ?? 0),
                reference: typeof data.state === 'string' ? data.state : undefined,
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.status) {
                return {
                    transactionId,
                    status: String(error.response.data.status),
                    amount: 0,
                };
            }
            throw error;
        }
    }
}

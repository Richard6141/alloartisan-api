import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface FedaPayInitResult {
    transactionId: string;
    paymentUrl: string;
    token: string;
}

export interface FedaPayTransaction {
    id: number | string;
    status: string; // approved | declined | cancelled | refunded
    amount: number; // en XOF
    reference?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Provider FedaPay — Intégration Gateway API v1
 * Documentation : https://docs.fedapay.com/api
 */
@Injectable()
export class FedaPayProvider {
    private readonly logger = new Logger(FedaPayProvider.name);
    private readonly client: AxiosInstance;
    private readonly isProduction: boolean;

    constructor(private readonly config: ConfigService) {
        const secretKey = config.get<string>('FEDAPAY_SECRET_KEY', '');
        const environment = config.get<string>('FEDAPAY_ENVIRONMENT', 'sandbox');

        this.isProduction = environment === 'production';

        const baseURL = this.isProduction
            ? 'https://api.fedapay.com/v1'
            : 'https://sandbox-api.fedapay.com/v1';

        this.client = axios.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            timeout: 10_000, // 10 secondes
        });

        this.logger.log(`✅ FedaPay initialisé — environnement: ${environment}`);
    }

    /**
     * Créer une transaction et retourner l'URL de paiement
     */
    async initiateTransaction(params: {
        montant: number; // En XOF (FCFA), pas de décimales
        description: string;
        referenceInterne: string; // ex: bookingId
        email: string;
        nom: string;
        prenom: string;
        successUrl?: string;
        cancelUrl?: string;
    }): Promise<FedaPayInitResult> {
        const {
            montant,
            description,
            referenceInterne,
            email,
            nom,
            prenom,
            successUrl,
            cancelUrl: _cancelUrl, // Conservé dans la signature publique mais non utilisé par l'API v1
        } = params;

        // Pour XOF (FCFA), on envoie directement le montant entier
        const response = await this.client.post('/transactions', {
            description,
            amount: Math.round(montant), // Assurer entier
            currency: { iso: 'XOF' },
            callback_url: successUrl,
            customer: {
                email,
                lastname: nom,
                firstname: prenom,
            },
            custom_metadata: {
                reference_interne: referenceInterne,
            },
        });

        // FORMAT RÉEL (vérifié sur le sandbox) : la clé racine contient un
        // slash — response.data['v1/transaction'], PAS data.v1.transaction
        const transaction = response.data?.['v1/transaction'];
        if (!transaction) {
            throw new Error('Réponse FedaPay invalide : transaction manquante');
        }

        // Générer le token de paiement : la réponse est { token, url } à la racine
        const tokenResponse = await this.client.post(`/transactions/${transaction.id}/token`);

        const token: string | undefined = tokenResponse.data?.token;
        const urlDirecte: string | undefined = tokenResponse.data?.url;
        if (!token && !urlDirecte) {
            throw new Error('Réponse FedaPay invalide : token manquant');
        }

        const paymentBaseUrl = this.isProduction
            ? 'https://checkout.fedapay.com'
            : 'https://sandbox-checkout.fedapay.com';

        // FedaPay fournit l'URL de checkout directement ; repli sur token
        const paymentUrl = urlDirecte ?? `${paymentBaseUrl}/${token}`;

        this.logger.log(
            `Transaction FedaPay créée: ${transaction.id} | Montant: ${montant} XOF | Ref: ${referenceInterne}`,
        );

        return {
            transactionId: String(transaction.id),
            paymentUrl,
            token: token ?? '',
        };
    }

    /**
     * Vérifier le statut d'une transaction (polling ou after webhook)
     */
    async getTransaction(transactionId: string): Promise<FedaPayTransaction> {
        const response = await this.client.get(`/transactions/${transactionId}`);
        // Clé racine avec slash (format réel de l'API, vérifié sur le sandbox)
        const transaction = response.data?.['v1/transaction'] ?? response.data?.v1?.transaction;

        if (!transaction) {
            throw new Error(`Transaction FedaPay ${transactionId} introuvable`);
        }

        return {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            reference: transaction.custom_metadata?.reference_interne,
            metadata: transaction.custom_metadata,
        };
    }

    /**
     * Effectuer un remboursement
     */
    async refundTransaction(transactionId: string): Promise<void> {
        await this.client.post(`/transactions/${transactionId}/refund`);
        this.logger.log(`Remboursement FedaPay initié: ${transactionId}`);
    }
}

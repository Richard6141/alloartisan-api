import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface KkiaPayInitResult {
    transactionId: string;
    status: string;
    message?: string;
}

export interface KkiaPayTransaction {
    transactionId: string;
    status: string; // SUCCESS | FAILED | CANCELLED | PENDING
    amount: number;
    reference?: string;
}

/**
 * Provider KkiaPay — Fallback Mobile Money (Bénin)
 * Documentation : https://docs.kkiapay.me
 */
@Injectable()
export class KkiaPayProvider {
    private readonly logger = new Logger(KkiaPayProvider.name);
    private readonly client: AxiosInstance;
    private readonly publicKey: string;

    constructor(private readonly config: ConfigService) {
        this.publicKey = config.get<string>('KKIAPAY_PUBLIC_KEY', '');
        const privateKey = config.get<string>('KKIAPAY_PRIVATE_KEY', '');
        const sandbox = config.get<string>('KKIAPAY_SANDBOX', 'true') === 'true';

        const baseURL = sandbox
            ? 'https://dev-api-checkout.kkiapay.me/api/v1'
            : 'https://api-checkout.kkiapay.me/api/v1';

        this.client = axios.create({
            baseURL,
            headers: {
                'x-private-key': privateKey,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        });

        this.logger.log(`✅ KkiaPay initialisé — sandbox: ${sandbox}`);
    }

    /**
     * Initier un paiement Mobile Money via KkiaPay
     */
    async initiatePayment(params: {
        montant: number;
        phoneNumber: string; // Numéro MTN/Moov Bénin
        name: string;
        referenceInterne: string;
        successUrl?: string;
    }): Promise<KkiaPayInitResult> {
        const { montant, phoneNumber, name, referenceInterne, successUrl } = params;

        const response = await this.client.post('/payment/init', {
            amount: Math.round(montant),
            phone: phoneNumber,
            name,
            data: referenceInterne,
            callback: successUrl,
            publicKey: this.publicKey,
        });

        const data = response.data;
        this.logger.log(
            `Paiement KkiaPay initié: ${data.transactionId} | Montant: ${montant} FCFA | Tél: ${phoneNumber}`,
        );

        return {
            transactionId: data.transactionId,
            status: data.status ?? 'PENDING',
            message: data.message,
        };
    }

    /**
     * Vérifier le statut d'un paiement KkiaPay
     */
    async getTransactionStatus(transactionId: string): Promise<KkiaPayTransaction> {
        const response = await this.client.get(`/payment/transaction`, {
            params: { transactionId },
        });

        const data = response.data;
        return {
            transactionId: data.transactionId,
            status: data.status,
            amount: data.amount,
            reference: data.data, // data contient notre référence interne
        };
    }
}

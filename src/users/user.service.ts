import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/common/services/session.service';
import { CryptoService } from 'src/common/services/crypto.service';
import { GetProfileResponseDto, UpdateProfileDto, DeleteAccountDto } from './dto';
import { Statut } from 'src/generated/prisma';
import * as argon from 'argon2';
import { authenticator } from 'otplib';

const USER_PROFILE_SELECT = {
    id: true,
    email: true,
    nom: true,
    prenom: true,
    telephone: true,
    dateNaissance: true,
    sexe: true,
    ville: true,
    photoUrl: true,
    role: true,
    statut: true,
    emailVerified: true,
    mfaEnabled: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private sessionService: SessionService,
        private cryptoService: CryptoService,
    ) {}

    private async validateSession(userId: string, sessionId: string): Promise<void> {
        const isActive = await this.sessionService.exists(userId, sessionId);
        if (!isActive) {
            throw new UnauthorizedException('Session invalide ou expirée');
        }
    }

    getAllUsers() {}

    async getProfile(userId: string): Promise<GetProfileResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: USER_PROFILE_SELECT,
        });

        if (!user) {
            throw new NotFoundException('Profil utilisateur non trouvé');
        }

        return user;
    }

    async updateProfile(
        userId: string,
        sessionId: string,
        dto: UpdateProfileDto,
    ): Promise<GetProfileResponseDto> {
        await this.validateSession(userId, sessionId);

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                nom: dto.nom,
                prenom: dto.prenom,
                telephone: dto.telephone,
                dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : undefined,
                sexe: dto.sexe,
                ville: dto.ville,
                quartier: dto.quartier,
                adressePrincipale: dto.adressePrincipale,
            },
            select: USER_PROFILE_SELECT,
        });

        return user;
    }

    async deleteAccount(
        userId: string,
        sessionId: string,
        dto: DeleteAccountDto,
    ): Promise<{ message: string }> {
        await this.validateSession(userId, sessionId);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true,
                mfaEnabled: true,
                mfaSecret: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Vérifier le mot de passe
        const passwordValid = await argon.verify(user.passwordHash, dto.password);
        if (!passwordValid) {
            throw new ForbiddenException('Mot de passe incorrect');
        }

        // Vérifier le code MFA si activé
        if (user.mfaEnabled && user.mfaSecret) {
            if (!dto.mfaCode) {
                throw new BadRequestException('Code MFA requis');
            }

            const decryptedSecret = this.cryptoService.decrypt(user.mfaSecret);
            const secretToVerify = decryptedSecret ?? user.mfaSecret;
            const isValidMfa = authenticator.verify({
                token: dto.mfaCode,
                secret: secretToVerify,
            });

            if (!isValidMfa) {
                throw new ForbiddenException('Code MFA invalide');
            }
        }

        // Soft delete : marquer comme supprimé
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                statut: Statut.BANNI,
            },
        });

        // Révoquer toutes les sessions
        await this.sessionService.revokeAll(userId);

        return { message: 'Compte supprimé avec succès' };
    }
}

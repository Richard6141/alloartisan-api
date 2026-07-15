import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/common/services/session.service';
import { CryptoService } from 'src/common/services/crypto.service';
import { CacheService } from 'src/common/services/cache.service';
import { GetProfileResponseDto, UpdateProfileDto, DeleteAccountDto } from './dto';
import { Statut } from 'src/generated/prisma';
import * as argon from 'argon2';
import { authenticator } from 'otplib';
import { UploadService, ImageVariants } from 'src/upload';

const USER_PROFILE_SELECT = {
    id: true,
    email: true,
    nom: true,
    prenom: true,
    telephone: true,
    dateNaissance: true,
    sexe: true,
    ville: true,
    quartier: true,
    adressePrincipale: true,
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
    private readonly logger = new Logger(UserService.name);

    constructor(
        private prisma: PrismaService,
        private sessionService: SessionService,
        private cryptoService: CryptoService,
        private cacheService: CacheService,
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
                photoUrl: dto.photoUrl,
            },
            select: USER_PROFILE_SELECT,
        });

        // Un ARTISAN qui change sa photo doit la voir changer PARTOUT :
        // les cartes et fiches affichent artisan.photoProfilUrl en priorité,
        // il faut donc la synchroniser (sinon l'ancienne photo reste figée).
        if (dto.photoUrl) {
            const artisan = await this.prisma.artisan.updateMany({
                where: { userId },
                data: { photoProfilUrl: dto.photoUrl },
            });
            if (artisan.count > 0) {
                this.logger.log(`Photo artisan synchronisée pour user=${userId}`);
                // Purger les caches concernés (fiche + résultats de recherche)
                const profil = await this.prisma.artisan.findUnique({
                    where: { userId },
                    select: { id: true },
                });
                if (profil) await this.cacheService.invalidateArtisanProfile(profil.id);
                await this.cacheService.delByPattern('cache:search:*');
            }
        }

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

    async updateProfilePhoto(
        userId: string,
        buffer: Buffer,
        uploadService: UploadService,
    ): Promise<ImageVariants> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { photoUrl: true },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Supprimer l'ancienne photo si elle existe
        if (user.photoUrl) {
            this.logger.log(`Ancienne photo trouvée: ${user.photoUrl}`);
            const publicId = uploadService.extractPublicIdFromUrl(user.photoUrl);
            this.logger.log(`Public ID extrait: ${publicId}`);

            if (publicId) {
                try {
                    await uploadService.deleteImage(publicId);
                    this.logger.log(`Ancienne photo supprimée avec succès: ${publicId}`);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.logger.warn(`Échec suppression ancienne photo: ${errorMessage}`);
                }
            } else {
                this.logger.warn(`Impossible d'extraire le publicId de: ${user.photoUrl}`);
            }
        }

        // Upload la nouvelle photo vers Cloudinary (buffer déjà sanitizé)
        const variants = await uploadService.uploadProfilePhoto(buffer, userId);

        // Mettre à jour l'utilisateur avec l'URL medium par défaut
        await this.prisma.user.update({
            where: { id: userId },
            data: { photoUrl: variants.medium },
        });

        return variants;
    }

    async deleteProfilePhoto(userId: string, uploadService: UploadService): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { photoUrl: true },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        if (!user.photoUrl) {
            throw new BadRequestException('Aucune photo de profil à supprimer');
        }

        // Supprimer de Cloudinary
        const publicId = uploadService.extractPublicIdFromUrl(user.photoUrl);
        if (publicId) {
            await uploadService.deleteImage(publicId);
        }

        // Mettre à jour l'utilisateur
        await this.prisma.user.update({
            where: { id: userId },
            data: { photoUrl: null },
        });
    }
}

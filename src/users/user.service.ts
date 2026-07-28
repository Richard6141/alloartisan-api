import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/common/services/session.service';
import { CryptoService } from 'src/common/services/crypto.service';
import { CacheService } from 'src/common/services/cache.service';
import { GetProfileResponseDto, UpdateProfileDto, DeleteAccountDto } from './dto';
import { Statut, Prisma } from 'src/generated/prisma';
import * as argon from 'argon2';
import { authenticator } from 'otplib';
import { UploadService, ImageVariants } from 'src/upload';
import { resolveEffectivePermissions, toPermissionList } from 'src/admin/permissions.resolve';

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
    adminRole: true,
    statut: true,
    emailVerified: true,
    mfaEnabled: true,
    createdAt: true,
    updatedAt: true,
    adminRoleId: true,
    permGranted: true,
    permRevoked: true,
    adminRoleRef: { select: { name: true, permissions: true } },
} as const;

type UserProfilePayload = Prisma.UserGetPayload<{ select: typeof USER_PROFILE_SELECT }>;

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

        const { adminRoleRef, permGranted, permRevoked, adminRoleId: _rid, ...rest } = user;
        const adminPermissions = toPermissionList(
            resolveEffectivePermissions({
                role: rest.role,
                adminRole: rest.adminRole,
                roleDefPermissions: adminRoleRef?.permissions ?? null,
                granted: permGranted ?? [],
                revoked: permRevoked ?? [],
            }),
        );
        return { ...rest, adminRoleName: adminRoleRef?.name ?? null, adminPermissions };
    }

    async updateProfile(
        userId: string,
        sessionId: string,
        dto: UpdateProfileDto,
    ): Promise<GetProfileResponseDto> {
        await this.validateSession(userId, sessionId);

        let rawUpdated: UserProfilePayload | null = null;
        try {
            rawUpdated = (await this.prisma.user.update({
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
            })) as unknown as UserProfilePayload;
        } catch (e) {
            // Numéro déjà pris par un autre compte : le téléphone est @unique.
            // Sans ce garde, Prisma levait P2002 non géré → 500 « Erreur du
            // serveur » à l'enregistrement du profil / de l'adresse.
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                const target = Array.isArray(e.meta?.target)
                    ? (e.meta?.target as string[]).join(',')
                    : String(e.meta?.target ?? '');
                if (target.includes('telephone')) {
                    throw new ConflictException(
                        'Ce numéro de téléphone est déjà utilisé par un autre compte.',
                    );
                }
                throw new ConflictException(
                    'Cette information est déjà utilisée par un autre compte.',
                );
            }
            throw e;
        }

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

        const { adminRoleRef: uRef, permGranted: uGr, permRevoked: uRev, adminRoleId: _uRid, ...uRest } = rawUpdated!;
        const updatedPermissions = toPermissionList(
            resolveEffectivePermissions({
                role: uRest.role,
                adminRole: uRest.adminRole,
                roleDefPermissions: uRef?.permissions ?? null,
                granted: uGr ?? [],
                revoked: uRev ?? [],
            }),
        );
        return { ...uRest, adminRoleName: uRef?.name ?? null, adminPermissions: updatedPermissions };
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

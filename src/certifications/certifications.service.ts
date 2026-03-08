import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Certification } from 'src/generated/prisma';
import {
    CreateCertificationDto,
    UpdateCertificationDto,
    CertificationResponseDto,
    CertificationListResponseDto,
    CertificationListItemDto,
} from './dto';

@Injectable()
export class CertificationsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Crée une nouvelle certification pour l'artisan connecté
     */
    async create(
        userId: string,
        dto: CreateCertificationDto,
        documentUrl?: string,
    ): Promise<CertificationResponseDto> {
        // Vérifier que l'utilisateur est un artisan
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true, deletedAt: true },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new ForbiddenException(
                'Vous devez être un artisan pour ajouter une certification',
            );
        }

        // Créer la certification
        const certification = await this.prisma.certification.create({
            data: {
                artisanId: artisan.id,
                titre: dto.titre,
                organisme: dto.organisme,
                dateObtention: dto.dateObtention ? new Date(dto.dateObtention) : null,
                numeroCertification: dto.numeroCertification,
                documentUrl: documentUrl ?? null,
                verifie: false,
            },
        });

        return this.formatCertificationResponse(certification);
    }

    /**
     * Récupère l'artisan ID depuis le user ID
     */
    async getArtisanIdByUserId(userId: string): Promise<string> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true, deletedAt: true },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new ForbiddenException('Profil artisan non trouvé');
        }

        return artisan.id;
    }

    /**
     * Récupère toutes les certifications d'un artisan (publiques vérifiées uniquement)
     */
    async findByArtisanId(
        artisanId: string,
        includeUnverified = false,
    ): Promise<CertificationListResponseDto> {
        // Vérifier que l'artisan existe
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: artisanId },
            select: { id: true, deletedAt: true },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new NotFoundException('Artisan non trouvé');
        }

        const where: { artisanId: string; verifie?: boolean } = {
            artisanId,
        };

        // Filtre pour n'afficher que les certifications vérifiées en mode public
        if (!includeUnverified) {
            where.verifie = true;
        }

        const certifications = await this.prisma.certification.findMany({
            where,
            orderBy: [{ verifie: 'desc' }, { dateObtention: 'desc' }],
        });

        return {
            data: certifications.map((c) => this.formatCertificationResponse(c)),
            total: certifications.length,
        };
    }

    /**
     * Récupère toutes les certifications de l'artisan connecté
     */
    async findMyAll(userId: string): Promise<CertificationListResponseDto> {
        const artisan = await this.prisma.artisan.findUnique({
            where: { userId },
            select: { id: true, deletedAt: true },
        });

        if (!artisan || artisan.deletedAt !== null) {
            throw new ForbiddenException('Profil artisan non trouvé');
        }

        const certifications = await this.prisma.certification.findMany({
            where: { artisanId: artisan.id },
            orderBy: [{ verifie: 'desc' }, { dateObtention: 'desc' }],
        });

        return {
            data: certifications.map((c) => this.formatCertificationResponse(c)),
            total: certifications.length,
        };
    }

    /**
     * Récupère une certification par son ID
     */
    async findOne(id: string): Promise<CertificationResponseDto> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        return this.formatCertificationResponse(certification);
    }

    /**
     * Met à jour une certification (seulement par son propriétaire)
     */
    async update(
        id: string,
        userId: string,
        dto: UpdateCertificationDto,
    ): Promise<CertificationResponseDto> {
        // Récupérer la certification avec l'artisan
        const certification = await this.prisma.certification.findUnique({
            where: { id },
            include: {
                artisan: {
                    select: { userId: true },
                },
            },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (certification.artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres certifications');
        }

        // Si la certification était vérifiée et que des données critiques changent,
        // remettre le statut de vérification à false
        const resetVerification =
            certification.verifie &&
            (dto.titre !== undefined ||
                dto.organisme !== undefined ||
                dto.dateObtention !== undefined ||
                dto.numeroCertification !== undefined);

        const updated = await this.prisma.certification.update({
            where: { id },
            data: {
                titre: dto.titre,
                organisme: dto.organisme,
                dateObtention: dto.dateObtention ? new Date(dto.dateObtention) : undefined,
                numeroCertification: dto.numeroCertification,
                verifie: resetVerification ? false : undefined,
            },
        });

        return this.formatCertificationResponse(updated);
    }

    /**
     * Met à jour le document d'une certification
     */
    async updateDocument(
        id: string,
        userId: string,
        documentUrl: string,
    ): Promise<CertificationResponseDto> {
        // Récupérer la certification avec l'artisan
        const certification = await this.prisma.certification.findUnique({
            where: { id },
            include: {
                artisan: {
                    select: { userId: true },
                },
            },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (certification.artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres certifications');
        }

        // Mettre à jour le document et reset la vérification
        const updated = await this.prisma.certification.update({
            where: { id },
            data: {
                documentUrl,
                verifie: false, // Reset car le document a changé
            },
        });

        return this.formatCertificationResponse(updated);
    }

    /**
     * Supprime une certification (seulement par son propriétaire)
     */
    async delete(id: string, userId: string): Promise<{ message: string }> {
        // Récupérer la certification avec l'artisan
        const certification = await this.prisma.certification.findUnique({
            where: { id },
            include: {
                artisan: {
                    select: { userId: true },
                },
            },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (certification.artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez supprimer que vos propres certifications');
        }

        await this.prisma.certification.delete({
            where: { id },
        });

        return { message: 'Certification supprimée avec succès' };
    }

    /**
     * Reset le statut de vérification d'une certification
     */
    async resetVerification(id: string, userId: string): Promise<void> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
            include: {
                artisan: {
                    select: { userId: true },
                },
            },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        if (certification.artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres certifications');
        }

        await this.prisma.certification.update({
            where: { id },
            data: { verifie: false },
        });
    }

    /**
     * Vérifie la propriété d'une certification et retourne l'artisan ID
     */
    async verifyCertificationOwnership(
        certificationId: string,
        userId: string,
    ): Promise<{ artisanId: string; documentUrl: string | null }> {
        const certification = await this.prisma.certification.findUnique({
            where: { id: certificationId },
            include: {
                artisan: {
                    select: { id: true, userId: true },
                },
            },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        if (certification.artisan.userId !== userId) {
            throw new ForbiddenException('Vous ne pouvez modifier que vos propres certifications');
        }

        return {
            artisanId: certification.artisan.id,
            documentUrl: certification.documentUrl,
        };
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Récupère toutes les certifications en attente de vérification
     */
    async findAllPending(): Promise<CertificationListResponseDto> {
        const certifications = await this.prisma.certification.findMany({
            where: { verifie: false },
            include: {
                artisan: {
                    select: {
                        id: true,
                        nomEntreprise: true,
                        user: {
                            select: {
                                id: true,
                                nom: true,
                                prenom: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return {
            data: certifications.map((c) => this.formatCertificationResponse(c)),
            total: certifications.length,
        };
    }

    /**
     * Vérifie ou rejette une certification (Admin uniquement)
     */
    async verify(id: string, verifie: boolean): Promise<CertificationResponseDto> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        const updated = await this.prisma.certification.update({
            where: { id },
            data: { verifie },
        });

        return this.formatCertificationResponse(updated);
    }

    /**
     * Supprime une certification (Admin - peut supprimer n'importe quelle certification)
     */
    async adminDelete(id: string): Promise<{ message: string }> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        await this.prisma.certification.delete({
            where: { id },
        });

        return { message: 'Certification supprimée avec succès' };
    }

    /**
     * Récupère les certifications sous forme légère pour les listes
     */
    async findListByArtisanId(
        artisanId: string,
        verifiedOnly = true,
    ): Promise<CertificationListItemDto[]> {
        const certifications = await this.prisma.certification.findMany({
            where: {
                artisanId,
                ...(verifiedOnly ? { verifie: true } : {}),
            },
            select: {
                id: true,
                titre: true,
                organisme: true,
                dateObtention: true,
                verifie: true,
            },
            orderBy: [{ verifie: 'desc' }, { dateObtention: 'desc' }],
        });

        return certifications;
    }

    /**
     * Formate la réponse d'une certification
     */
    private formatCertificationResponse(certification: Certification): CertificationResponseDto {
        return {
            id: certification.id,
            artisanId: certification.artisanId,
            titre: certification.titre,
            organisme: certification.organisme,
            dateObtention: certification.dateObtention,
            numeroCertification: certification.numeroCertification,
            documentUrl: certification.documentUrl,
            verifie: certification.verifie,
            createdAt: certification.createdAt,
        };
    }
}

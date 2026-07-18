import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { Certification, StatutArtisan } from 'src/generated/prisma';
import {
    CreateCertificationDto,
    UpdateCertificationDto,
    CertificationResponseDto,
    CertificationListResponseDto,
    CertificationListItemDto,
} from './dto';

@Injectable()
export class CertificationsService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) {}

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

        const type = dto.type ?? 'METIER';

        // IDENTITE : une seule pièce d'identité par artisan — pour la changer,
        // on remplace son document (le flux existe déjà côté app)
        if (type === 'IDENTITE') {
            const existing = await this.prisma.certification.findFirst({
                where: { artisanId: artisan.id, type: 'IDENTITE' },
                select: { id: true },
            });
            if (existing) {
                throw new ConflictException(
                    "Une pièce d'identité existe déjà : remplacez son document au lieu d'en ajouter une nouvelle",
                );
            }
        }

        // METIER : la preuve doit viser un métier réellement déclaré par l'artisan
        if (type === 'METIER' && dto.metierId) {
            const exerce = await this.prisma.artisanMetier.findFirst({
                where: { artisanId: artisan.id, metierId: dto.metierId },
                select: { id: true },
            });
            if (!exerce) {
                throw new BadRequestException(
                    "Ce métier ne fait pas partie de votre profil : ajoutez-le d'abord dans votre profil professionnel",
                );
            }
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
                type,
                metierId: type === 'METIER' ? (dto.metierId ?? null) : null,
            },
        });

        // Nouvelle preuve envoyée : un profil rejeté repart en file d'examen
        await this.requeueArtisanIfRejected(artisan.id);

        return this.formatCertificationResponse(certification);
    }

    /**
     * Resoumission : quand l'artisan corrige son dossier (nouvelle preuve ou
     * document remplacé), un profil REJETE repasse EN_ATTENTE pour être réexaminé.
     */
    private async requeueArtisanIfRejected(artisanId: string): Promise<void> {
        await this.prisma.artisan.updateMany({
            where: { id: artisanId, statut: StatutArtisan.REJETE },
            data: { statut: StatutArtisan.EN_ATTENTE, raisonSuspension: null },
        });
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

        const where: { artisanId: string; verifie?: boolean; type?: string } = {
            artisanId,
        };

        // Filtre pour n'afficher que les certifications vérifiées en mode public.
        // CONFIDENTIALITÉ : la pièce d'identité ne sort JAMAIS sur une route publique.
        if (!includeUnverified) {
            where.verifie = true;
            where.type = 'METIER';
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
     * VERROU : un document VALIDÉ ne peut plus être touché par l'artisan
     * (ni modifié, ni remplacé, ni supprimé). Seul un admin peut le
     * déverrouiller depuis son dashboard — sur demande de l'artisan.
     */
    private assertModifiableParArtisan(certification: {
        verifie: boolean;
        statutVerification: string;
    }): void {
        if (certification.verifie || certification.statutVerification === 'VALIDEE') {
            throw new ForbiddenException(
                'Ce document a été validé et est verrouillé. Contactez le support pour demander son déverrouillage.',
            );
        }
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

        this.assertModifiableParArtisan(certification);

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
                statutVerification: resetVerification ? 'EN_ATTENTE' : undefined,
                raisonRejet: resetVerification ? null : undefined,
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

        this.assertModifiableParArtisan(certification);

        // Mettre à jour le document et reset la vérification
        const updated = await this.prisma.certification.update({
            where: { id },
            data: {
                documentUrl,
                verifie: false, // Reset car le document a changé
                statutVerification: 'EN_ATTENTE',
                raisonRejet: null,
            },
        });

        // Document corrigé : un profil rejeté repart en file d'examen
        await this.requeueArtisanIfRejected(certification.artisanId);

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

        this.assertModifiableParArtisan(certification);

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
            data: { verifie: false, statutVerification: 'EN_ATTENTE', raisonRejet: null },
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

        // Cette vérification sert le flux de REMPLACEMENT de document :
        // un document validé est verrouillé (l'ancien fichier serait sinon
        // supprimé du CDN avant même le contrôle)
        this.assertModifiableParArtisan(certification);

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
            // Les documents REJETÉS attendent une correction de l'artisan,
            // pas une action admin : ils ne polluent pas la file d'examen
            where: { verifie: false, statutVerification: 'EN_ATTENTE' },
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
    async verify(
        id: string,
        verifie: boolean,
        raisonRejet?: string,
    ): Promise<CertificationResponseDto> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        const updated = await this.prisma.certification.update({
            where: { id },
            data: {
                verifie,
                statutVerification: verifie ? 'VALIDEE' : 'REJETEE',
                // Le motif est lisible par l'artisan : il corrige puis resoumets
                raisonRejet: verifie ? null : (raisonRejet ?? null),
            },
        });

        // Valider une preuve de métier certifie ce métier chez l'artisan
        // (le badge « certifié » du métier suit la décision de l'admin)
        if (certification.type === 'METIER' && certification.metierId) {
            await this.prisma.artisanMetier.updateMany({
                where: {
                    artisanId: certification.artisanId,
                    metierId: certification.metierId,
                },
                data: { certifie: verifie },
            });
        }

        // Prévenir l'artisan de la décision (avec le motif en cas de refus)
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: certification.artisanId },
            select: { userId: true },
        });
        if (artisan) {
            // Une pièce d'IDENTITÉ validée alimente le badge « identité vérifiée »
            // du profil travailleur (main-d'œuvre), s'il en possède un. Un refus
            // le retire. Sans ce câblage, le badge restait toujours faux.
            if (certification.type === 'IDENTITE') {
                await this.prisma.profilTravailleur.updateMany({
                    where: { userId: artisan.userId },
                    data: { identiteVerifiee: verifie },
                });
            }
            const nomDoc =
                certification.type === 'IDENTITE'
                    ? "Votre pièce d'identité"
                    : `« ${certification.titre} »`;
            void this.notificationService.send({
                userId: artisan.userId,
                type: 'SYSTEME',
                titre: verifie ? 'Document validé ✓' : 'Document refusé',
                corps: verifie
                    ? `${nomDoc} a été approuvé par notre équipe.`
                    : `${nomDoc} n'a pas pu être validé.${raisonRejet ? ` Motif : ${raisonRejet}` : ''} Remplacez le document dans l'app pour resoumettre.`,
                data: { screen: 'justificatifs', certificationId: certification.id },
            });
        }

        return this.formatCertificationResponse(updated);
    }

    /**
     * Déverrouille un document VALIDÉ (Admin uniquement, sur demande de
     * l'artisan) : il repasse EN_ATTENTE et redevient modifiable/remplaçable.
     * Le badge « certifié » du métier concerné est retiré en attendant la
     * nouvelle validation.
     */
    async unlock(id: string): Promise<CertificationResponseDto> {
        const certification = await this.prisma.certification.findUnique({
            where: { id },
        });

        if (!certification) {
            throw new NotFoundException('Certification non trouvée');
        }

        if (!certification.verifie && certification.statutVerification !== 'VALIDEE') {
            throw new BadRequestException("Ce document n'est pas verrouillé");
        }

        const updated = await this.prisma.certification.update({
            where: { id },
            data: { verifie: false, statutVerification: 'EN_ATTENTE', raisonRejet: null },
        });

        if (certification.type === 'METIER' && certification.metierId) {
            await this.prisma.artisanMetier.updateMany({
                where: {
                    artisanId: certification.artisanId,
                    metierId: certification.metierId,
                },
                data: { certifie: false },
            });
        }

        // Prévenir l'artisan : il peut maintenant modifier son document
        const artisan = await this.prisma.artisan.findUnique({
            where: { id: certification.artisanId },
            select: { userId: true },
        });
        if (artisan) {
            const nomDoc =
                certification.type === 'IDENTITE'
                    ? "Votre pièce d'identité"
                    : `« ${certification.titre} »`;
            void this.notificationService.send({
                userId: artisan.userId,
                type: 'SYSTEME',
                titre: 'Document déverrouillé',
                corps: `${nomDoc} a été déverrouillé par notre équipe : vous pouvez maintenant le modifier ou le remplacer dans l'app.`,
                data: { screen: 'justificatifs', certificationId: certification.id },
            });
        }

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
                type: 'METIER', // liste destinée à la fiche : jamais la pièce d'identité
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
            type: certification.type as 'IDENTITE' | 'METIER',
            metierId: certification.metierId,
            statutVerification: certification.statutVerification as
                | 'EN_ATTENTE'
                | 'VALIDEE'
                | 'REJETEE',
            raisonRejet: certification.raisonRejet,
            createdAt: certification.createdAt,
        };
    }
}

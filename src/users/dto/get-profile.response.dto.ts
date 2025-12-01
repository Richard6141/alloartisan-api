import { Role, Statut } from 'src/generated/prisma';

export class GetProfileResponseDto {
    id: string;
    email: string;
    nom: string | null;
    prenom: string | null;
    telephone: string | null;
    dateNaissance: Date | null;
    sexe: string | null;
    ville: string | null;
    photoUrl: string | null;
    role: Role;
    statut: Statut;
    emailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

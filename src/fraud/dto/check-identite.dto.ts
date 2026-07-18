import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckIdentiteDto {
    @ApiPropertyOptional({ description: "Numéro de la pièce d'identité" })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    numeroPiece?: string;

    @ApiPropertyOptional({
        description: 'Nom complet (pour le rapprochement nom + date de naissance)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    nom?: string;

    @ApiPropertyOptional({ description: 'Date de naissance (YYYY-MM-DD)' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    dateNaissance?: string;

    @ApiPropertyOptional({ description: "Artisan à exclure (le dossier en cours d'examen)" })
    @IsOptional()
    @IsString()
    @MaxLength(36)
    excludeArtisanId?: string;
}

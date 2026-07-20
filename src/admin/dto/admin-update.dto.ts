import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateUserAdminDto {
    @ApiPropertyOptional({ maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    prenom?: string;

    @ApiPropertyOptional({ maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    nom?: string;

    @ApiPropertyOptional({ maxLength: 30 })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    telephone?: string;

    @ApiPropertyOptional({ enum: ['CLIENT', 'ARTISAN', 'ADMIN'] })
    @IsOptional()
    @IsIn(['CLIENT', 'ARTISAN', 'ADMIN'])
    role?: 'CLIENT' | 'ARTISAN' | 'ADMIN';
}

export class UpdateArtisanAdminDto {
    @ApiPropertyOptional({ maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nomEntreprise?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @ApiPropertyOptional({ maxLength: 80 })
    @IsOptional()
    @IsString()
    @MaxLength(80)
    villePrincipale?: string;

    @ApiPropertyOptional({ enum: ['GRATUIT', 'STANDARD', 'PREMIUM', 'GOLD'] })
    @IsOptional()
    @IsIn(['GRATUIT', 'STANDARD', 'PREMIUM', 'GOLD'])
    abonnementType?: 'GRATUIT' | 'STANDARD' | 'PREMIUM' | 'GOLD';

    @ApiPropertyOptional({ description: "Date d'expiration de l'abonnement (ISO 8601)" })
    @IsOptional()
    @IsDateString()
    abonnementExpireAt?: string;

    @ApiPropertyOptional({ description: 'Marquer comme vérifié' })
    @IsOptional()
    @IsBoolean()
    verified?: boolean;
}

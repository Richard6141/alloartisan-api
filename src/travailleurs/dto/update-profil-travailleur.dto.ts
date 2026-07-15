import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProfilTravailleurDto } from './create-profil-travailleur.dto';

export class UpdateProfilTravailleurDto extends PartialType(CreateProfilTravailleurDto) {
    @IsOptional()
    @IsBoolean()
    actif?: boolean;
}

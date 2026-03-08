import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateArtisanDto } from './create-artisan.dto';

export class UpdateArtisanDto extends PartialType(
    OmitType(CreateArtisanDto, ['metiers'] as const),
) {}

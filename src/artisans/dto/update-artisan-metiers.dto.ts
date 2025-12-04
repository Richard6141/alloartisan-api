import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArtisanMetierInputDto } from './create-artisan.dto';

export class UpdateArtisanMetiersDto {
    @ApiProperty({
        description: "Liste des métiers de l'artisan",
        type: [ArtisanMetierInputDto],
    })
    @IsArray()
    @ArrayMinSize(1, { message: "L'artisan doit exercer au moins un métier" })
    @ValidateNested({ each: true })
    @Type(() => ArtisanMetierInputDto)
    metiers: ArtisanMetierInputDto[];
}

import { PartialType } from '@nestjs/swagger';
import { CreateCategorieMetierDto } from './create-categorie-metier.dto';

export class UpdateCategorieMetierDto extends PartialType(CreateCategorieMetierDto) {}

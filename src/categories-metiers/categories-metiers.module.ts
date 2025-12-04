import { Module } from '@nestjs/common';
import { CategoriesMetiersService } from './categories-metiers.service';
import { CategoriesMetiersController } from './categories-metiers.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [CategoriesMetiersController],
    providers: [CategoriesMetiersService],
    exports: [CategoriesMetiersService],
})
export class CategoriesMetiersModule {}

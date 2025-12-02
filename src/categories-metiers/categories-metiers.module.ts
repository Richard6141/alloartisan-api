import { Module } from '@nestjs/common';
import { CategoriesMetiersService } from './categories-metiers.service';
import { CategoriesMetiersController } from './categories-metiers.controller';

@Module({
    controllers: [CategoriesMetiersController],
    providers: [CategoriesMetiersService],
    exports: [CategoriesMetiersService],
})
export class CategoriesMetiersModule {}

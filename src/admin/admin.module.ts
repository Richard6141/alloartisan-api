import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * AdminModule — Dashboard d'administration (Sprint 8)
 *
 * Toutes les routes sont protégées par RolesGuard + @Roles(Role.ADMIN).
 * Ce module ne dépend que de PrismaModule pour les stats et la gestion des données.
 */
@Module({
    imports: [PrismaModule],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGrowthService } from './admin-growth.service';
import { AdminGrowthController } from './admin-growth.controller';
import { AdminPermGuard } from './rbac.guard';
import { RolesService } from './roles.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { TrackingModule } from 'src/tracking/tracking.module';

/**
 * AdminModule — Dashboard d'administration (Sprint 8)
 *
 * Toutes les routes sont protégées par RolesGuard + @Roles(Role.ADMIN).
 * Ce module ne dépend que de PrismaModule pour les stats et la gestion des données.
 */
@Module({
    // CommonModule (SessionService) + gateways WS : révoquer sessions ET couper
    // les sockets en direct quand un compte est suspendu/banni.
    imports: [PrismaModule, CommonModule, MessagingModule, TrackingModule],
    controllers: [AdminController, AdminGrowthController],
    providers: [AdminService, AdminGrowthService, AdminPermGuard, RolesService],
    exports: [AdminService, RolesService],
})
export class AdminModule {}

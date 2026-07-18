import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { IdentiteService } from './identite.service';
import { FraudController } from './fraud.controller';
import { FraudScheduler } from './fraud.scheduler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';

/**
 * FraudModule — Sprint 12
 *
 * Système de scoring fraude basé sur des règles métier.
 * Score 0-100 calculé en temps réel avec cache Redis 5min.
 * Scan quotidien automatique via scheduler à 3h UTC.
 *
 * Dépendances :
 * - PrismaModule → accès DB pour collecte des signaux
 * - CommonModule → CacheService (Redis TTL 5min)
 */
@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [FraudController],
    providers: [FraudService, IdentiteService, FraudScheduler],
    exports: [FraudService, IdentiteService],
})
export class FraudModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingScheduler } from './booking.scheduler';
import { NotificationScheduler } from './notification.scheduler';
import { SubscriptionScheduler } from './subscription.scheduler';
import { ReminderScheduler } from './reminder.scheduler';
import { MediaCleanupScheduler } from './media-cleanup.scheduler';
import { BookingModule } from 'src/booking/booking.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { CommonModule } from 'src/common/common.module';
import { DemandesExpressModule } from 'src/demandes-express/demandes-express.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        BookingModule,
        PrismaModule,
        NotificationModule,
        SubscriptionsModule,
        CommonModule,
        DemandesExpressModule,
    ],
    providers: [
        BookingScheduler,
        NotificationScheduler,
        SubscriptionScheduler,
        ReminderScheduler,
        MediaCleanupScheduler,
    ],
    exports: [
        BookingScheduler,
        NotificationScheduler,
        SubscriptionScheduler,
        ReminderScheduler,
        MediaCleanupScheduler,
    ],
})
export class SchedulerModule {}

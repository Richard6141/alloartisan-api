import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingScheduler } from './booking.scheduler';
import { NotificationScheduler } from './notification.scheduler';
import { SubscriptionScheduler } from './subscription.scheduler';
import { BookingModule } from 'src/booking/booking.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        BookingModule,
        PrismaModule,
        NotificationModule,
        SubscriptionsModule,
    ],
    providers: [BookingScheduler, NotificationScheduler, SubscriptionScheduler],
    exports: [BookingScheduler, NotificationScheduler, SubscriptionScheduler],
})
export class SchedulerModule { }


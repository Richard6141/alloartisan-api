import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingScheduler } from './booking.scheduler';
import { NotificationScheduler } from './notification.scheduler';
import { BookingModule } from 'src/booking/booking.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [ScheduleModule.forRoot(), BookingModule, PrismaModule, NotificationModule],
    providers: [BookingScheduler, NotificationScheduler],
    exports: [BookingScheduler, NotificationScheduler],
})
export class SchedulerModule {}

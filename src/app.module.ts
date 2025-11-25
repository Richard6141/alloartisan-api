import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArtisansModule } from './artisans/artisans.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtGuard } from './common/guards';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        UsersModule,
        ArtisansModule,
        PrismaModule,
    ],
    providers: [
        {
            provide: 'APP_GUARD',
            useClass: AtGuard,
        },
    ],
})
export class AppModule {}

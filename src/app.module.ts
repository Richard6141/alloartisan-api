import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArtisansModule } from './artisans/artisans.module';

@Module({
  imports: [AuthModule, UsersModule, ArtisansModule],
})
export class AppModule {}

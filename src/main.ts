import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { AtGuard } from './common/guards';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    // const reflactor = new Reflector();
    // app.useGlobalGuards(new AtGuard(reflactor));
    await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();

import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

@Controller('health')
class TestHealthController {
    @Get()
    check() {
        return { status: 'ok' };
    }
}

@Module({
    controllers: [TestHealthController],
})
class TestAppModule {}

describe('AppController (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/health (GET)', async () => {
        const response = await request(app.getHttpServer()).get('/health').expect(200);
        expect(response.body?.status).toBe('ok');
    });
});

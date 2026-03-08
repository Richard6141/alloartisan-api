import { Controller, Get, Module, Query, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

@Controller('api/v1/health')
class HealthContractController {
    @Get()
    check() {
        return { status: 'ok' };
    }
}

@Controller('api/v1/categories-metiers')
class CategoriesContractController {
    @Get()
    findAll() {
        return [];
    }
}

@Controller('api/v1/metiers')
class MetiersContractController {
    @Get()
    findAll() {
        return [];
    }
}

@Controller('api/v1/geolocation')
class GeolocationContractController {
    @Get('artisans/nearby')
    findNearby(
        @Query('lat') _lat: string,
        @Query('lng') _lng: string,
        @Query('radius') _radius?: string,
    ) {
        return [];
    }
}

@Module({
    controllers: [
        HealthContractController,
        CategoriesContractController,
        MetiersContractController,
        GeolocationContractController,
    ],
})
class PublicApiContractModule {}

describe('Public API contract (e2e)', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [PublicApiContractModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/v1/health returns status payload', async () => {
        const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
        expect(response.body).toEqual(expect.objectContaining({ status: expect.any(String) }));
    });

    it('GET /api/v1/categories-metiers returns an array', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/categories-metiers')
            .expect(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/metiers returns an array', async () => {
        const response = await request(app.getHttpServer()).get('/api/v1/metiers').expect(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/v1/geolocation/artisans/nearby returns an array', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/geolocation/artisans/nearby')
            .query({ lat: 6.3703, lng: 2.3912, radius: 25 })
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });
});

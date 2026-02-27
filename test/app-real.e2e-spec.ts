import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const describeRealE2E = process.env.RUN_REAL_E2E === 'true' ? describe : describe.skip;

describeRealE2E('AppModule public routes (real e2e)', () => {
    let app: INestApplication<App>;
    const uniqueEmail = `e2e_${Date.now()}@alloartisan.dev`;
    const strongPassword = 'StrongE2E!123';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/v1/health returns health payload', async () => {
        const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                status: expect.any(String),
                info: expect.any(Object),
                details: expect.any(Object),
            }),
        );
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

    it('GET /api/v1/users/me without token returns 401', async () => {
        await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('POST /api/v1/auth/register with invalid payload returns 400', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email: 'invalid-email', password: '123' })
            .expect(400);
    });

    it('POST /api/v1/auth/register then GET /api/v1/users/me with token works', async () => {
        const registerResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email: uniqueEmail, password: strongPassword })
            .expect(201);

        const accessToken = registerResponse.body?.access_token as string | undefined;
        expect(accessToken).toBeDefined();

        const meResponse = await request(app.getHttpServer())
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(meResponse.body).toEqual(
            expect.objectContaining({
                email: uniqueEmail,
                id: expect.any(String),
            }),
        );
    });

    it('POST /api/v1/auth/register with duplicate email returns 409', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email: uniqueEmail, password: strongPassword })
            .expect(409);
    });
});

import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';

describe('AuditLogInterceptor', () => {
    const logActiviteService = {
        log: jest.fn(),
    };

    let interceptor: AuditLogInterceptor;

    beforeEach(() => {
        jest.clearAllMocks();
        interceptor = new AuditLogInterceptor(logActiviteService as never);
    });

    it('logs a POST request', (done) => {
        const context = createHttpContext({
            method: 'POST',
            url: '/api/v1/bookings',
            routePath: '/bookings',
        });
        const next: CallHandler = { handle: () => of({ ok: true }) };

        interceptor.intercept(context, next).subscribe({
            complete: () => {
                expect(logActiviteService.log).toHaveBeenCalledTimes(1);
                expect(logActiviteService.log).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action: 'POST /bookings',
                        entite: 'bookings',
                    }),
                );
                done();
            },
        });
    });

    it('does not log a GET request', (done) => {
        const context = createHttpContext({
            method: 'GET',
            url: '/api/v1/metiers',
            routePath: '/metiers',
        });
        const next: CallHandler = { handle: () => of({ ok: true }) };

        interceptor.intercept(context, next).subscribe({
            complete: () => {
                expect(logActiviteService.log).not.toHaveBeenCalled();
                done();
            },
        });
    });
});

function createHttpContext(input: {
    method: string;
    url: string;
    routePath: string;
}): ExecutionContext {
    const request = {
        method: input.method,
        url: input.url,
        route: { path: input.routePath },
        params: {},
        headers: { 'user-agent': 'jest' },
        ip: '127.0.0.1',
        user: { sub: 'user-1', role: 'ADMIN', email: 'test@alloartisan.dev' },
    };

    const response = { statusCode: 200 };

    return {
        getType: () => 'http',
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
            getNext: jest.fn(),
        }),
    } as unknown as ExecutionContext;
}

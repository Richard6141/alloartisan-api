import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LogActiviteService } from 'src/common/services';

type AuthUser = {
    sub?: string;
    email?: string;
    role?: string;
};

type RequestWithUser = Request & { user?: AuthUser };

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    private static readonly SKIPPED_PATHS = ['/api/v1/health', '/api/v1/docs', '/api/v1/reference'];
    private static readonly LOGGED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

    constructor(private readonly logActiviteService: LogActiviteService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const http = context.switchToHttp();
        const request = http.getRequest<RequestWithUser>();
        const response = http.getResponse<Response>();

        if (!AuditLogInterceptor.LOGGED_METHODS.has(request.method)) {
            return next.handle();
        }

        if (AuditLogInterceptor.SKIPPED_PATHS.some((path) => request.url.startsWith(path))) {
            return next.handle();
        }

        const startedAt = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const durationMs = Date.now() - startedAt;
                    const action = `${request.method} ${request.route?.path ?? request.url}`;
                    const firstPathSegment =
                        request.route?.path
                            ?.split('/')
                            .filter(Boolean)
                            .find((segment) => !segment.startsWith(':')) ?? 'unknown';

                    this.logActiviteService.log({
                        userId: request.user?.sub,
                        action,
                        entite: firstPathSegment,
                        entiteId: this.extractEntityId(request),
                        metadata: {
                            statusCode: response.statusCode,
                            durationMs,
                            role: request.user?.role ?? null,
                            email: request.user?.email ?? null,
                        },
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                    });
                },
            }),
        );
    }

    private extractEntityId(request: Request): string | undefined {
        const routeParams = request.params;
        const routeParamKeys = ['id', 'bookingId', 'artisanId', 'transactionId', 'conversationId'];

        for (const key of routeParamKeys) {
            const value = routeParams[key];
            if (value) return value;
        }

        return undefined;
    }
}

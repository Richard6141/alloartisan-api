import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException ? exception.getResponse() : null;

        let message: string | string[];
        let error: string;

        if (exceptionResponse && typeof exceptionResponse === 'object') {
            const resp = exceptionResponse as Record<string, unknown>;
            message = (resp.message as string | string[]) ?? 'Internal server error';
            error = (resp.error as string) ?? HttpStatus[status];
        } else {
            message =
                typeof exceptionResponse === 'string' ? exceptionResponse : 'Internal server error';
            error = HttpStatus[status] ?? 'Internal Server Error';
        }

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url} — ${exception instanceof Error ? exception.message : String(exception)}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}

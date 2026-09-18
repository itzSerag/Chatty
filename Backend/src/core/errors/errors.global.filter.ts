import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected error occurred';

        // Handle known NestJS HTTP exceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responsePayload = exception.getResponse();
            if (typeof responsePayload === 'string') {
                message = responsePayload;
            } else if (typeof responsePayload === 'object' && responsePayload !== null && 'message' in responsePayload) {
                message = (responsePayload as { message: string }).message || message;
            }
        }
        // Handle Postgres/Database Errors (e.g. unique constraint 23505, foreign key 23503)
        else if (exception && typeof exception === 'object' && 'code' in exception) {
            const dbError = exception as { code?: string; detail?: string; message?: string };
            if (dbError.code === '23505') {
                status = HttpStatus.CONFLICT;
                message = dbError.detail || 'A record with this field already exists.';
            } else if (dbError.code === '23503') {
                status = HttpStatus.BAD_REQUEST;
                message = dbError.detail || 'Related record not found (Foreign key constraint violation).';
            } else if (dbError.code === '23502') {
                status = HttpStatus.BAD_REQUEST;
                message = `Missing required field: ${dbError.detail || ''}`;
            } else {
                status = HttpStatus.BAD_REQUEST;
                message = dbError.message || 'Database operation failed.';
            }
        }
        // Handle unexpected errors
        else {
            const error = exception as Error;
            message = error?.message || message;
        }

        // Clean one-line logging: only log full stack traces for 5xx server errors
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[${request.method}] ${request.url} ${status} - ${message}`,
                (exception as Error)?.stack,
            );
        } else {
            this.logger.warn(`[${request.method}] ${request.url} ${status} - ${message}`);
        }

        // Send the response
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
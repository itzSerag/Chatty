import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        // Handle Prisma Known Request Errors
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                status = HttpStatus.CONFLICT;
                const target = (exception.meta?.target as string[]) || [];
                message = target.length
                    ? `This '${target.join(', ')}' already exists.`
                    : 'A record with this unique field already exists.';
            } else if (exception.code === 'P2025') {
                status = HttpStatus.NOT_FOUND;
                message = (exception.meta?.cause as string) || 'Record not found.';
            } else if (exception.code === 'P2003') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Related record not found (Foreign key constraint violation).';
            } else {
                status = HttpStatus.BAD_REQUEST;
                message = `Database error: ${exception.message}`;
            }
        }
        // Handle Prisma Validation Errors
        else if (exception instanceof Prisma.PrismaClientValidationError) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided for database operation.';
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
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  errors?: string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Global HTTP exception filter (error-use-exception-filters).
 * Catches ALL exceptions and formats them into a consistent JSON shape.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errors: string[] | undefined;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        const parsed = exceptionResponse as Record<string, unknown>;
        const parsedMessage = parsed.message;

        if (Array.isArray(parsedMessage)) {
          message = 'Validation failed';
          errors = parsedMessage as string[];
        } else {
          message = (parsedMessage as string) ?? exception.message;
        }

        error = (parsed.error as string) ?? exception.name;
      }
    } else {
      // Unhandled / unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';

      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}

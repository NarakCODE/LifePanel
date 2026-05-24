import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Transform interceptor (api-use-interceptors).
 * Wraps every successful response in a standard { success, data, timestamp } envelope.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'meta' in (data as Record<string, unknown>) &&
          'data' in (data as Record<string, unknown>)
        ) {
          const payload = data as unknown as {
            data: T;
            meta: Record<string, unknown>;
          };

          return {
            success: true,
            data: payload.data,
            meta: payload.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

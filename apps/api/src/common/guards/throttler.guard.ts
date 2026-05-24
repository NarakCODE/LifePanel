import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard extension that respects @Public() routes.
 * IS_PUBLIC_KEY and Public are defined in common/decorators/public.decorator.ts
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {}

import { SetMetadata } from '@nestjs/common';

/**
 * Mark a controller or route as publicly accessible (no JWT required).
 *
 * Usage:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

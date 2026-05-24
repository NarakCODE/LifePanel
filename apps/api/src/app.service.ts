import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { name: string; version: string } {
    return {
      name: 'Life Dashboard API',
      version: '1.0.0',
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API metadata', () => {
      const result = appController.getRoot();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result.name).toBe('Life Dashboard API');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { StandaloneController } from './standalone.controller';
import { StandaloneService } from './standalone.service';

describe('StandaloneController', () => {
  let standaloneController: StandaloneController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [StandaloneController],
      providers: [StandaloneService],
    }).compile();

    standaloneController = app.get<StandaloneController>(StandaloneController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(standaloneController.getHello()).toBe('Hello World!');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EntityController } from './entity.controller';
import { EntityService } from './entity.service';

describe('EntityController', () => {
  let entityController: EntityController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EntityController],
      providers: [EntityService],
    }).compile();

    entityController = app.get<EntityController>(EntityController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(entityController.getHello()).toBe('Hello World!');
    });
  });
});

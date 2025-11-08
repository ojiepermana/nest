import { Test, TestingModule } from '@nestjs/testing';
import { NestService } from './nest.service';

describe('NestService', () => {
  let service: NestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestService],
    }).compile();

    service = module.get<NestService>(NestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

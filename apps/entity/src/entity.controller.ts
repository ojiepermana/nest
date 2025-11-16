import { Controller, Get } from '@nestjs/common';
import { EntityService } from './entity.service';

@Controller()
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  getHello(): string {
    return this.entityService.getHello();
  }
}

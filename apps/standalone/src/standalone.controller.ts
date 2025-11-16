import { Controller, Get } from '@nestjs/common';
import { StandaloneService } from './standalone.service';

@Controller()
export class StandaloneController {
  constructor(private readonly standaloneService: StandaloneService) {}

  @Get()
  getHello(): string {
    return this.standaloneService.getHello();
  }
}

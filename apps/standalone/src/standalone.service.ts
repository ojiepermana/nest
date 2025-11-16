import { Injectable } from '@nestjs/common';

@Injectable()
export class StandaloneService {
  getHello(): string {
    return 'Hello World!';
  }
}

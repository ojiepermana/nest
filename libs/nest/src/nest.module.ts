import { Module } from '@nestjs/common';
import { NestService } from './nest.service';

@Module({
  providers: [NestService],
  exports: [NestService],
})
export class NestModule {}

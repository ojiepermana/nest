import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BranchController } from './controllers/branch.controller';
import { BranchService } from './services/branch.service';
import { BranchRepository } from './repositories/branch.repository';

@Module({
  imports: [CacheModule.register()],
  controllers: [BranchController],
  providers: [BranchService, BranchRepository],
  exports: [BranchService, BranchRepository]
})
export class BranchModule {}

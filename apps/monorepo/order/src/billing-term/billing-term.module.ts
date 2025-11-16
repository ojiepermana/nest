import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BillingTermController } from './controllers/billing-term.controller';
import { BillingTermService } from './services/billing-term.service';
import { BillingTermRepository } from './repositories/billing-term.repository';

@Module({
  imports: [CacheModule.register()],
  controllers: [BillingTermController],
  providers: [BillingTermService, BillingTermRepository],
  exports: [BillingTermService, BillingTermRepository]
})
export class BillingTermModule {}

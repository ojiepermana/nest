import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { BillingTermService } from '../services/billing-term.service';
import { CreateBillingTermDto } from '../dto/billing-term/create-billing-term.dto';
import { UpdateBillingTermDto } from '../dto/billing-term/update-billing-term.dto';
import { BillingTermFilterDto } from '../dto/billing-term/billing-term-filter.dto';

@Controller()
export class BillingTermController {
  constructor(private readonly service: BillingTermService) {}


  // GENERATED_HANDLER_START: findAll
  @MessagePattern('billing-term.findAll')
  async findAll(@Payload() filters: BillingTermFilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
  @MessagePattern('billing-term.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
  @MessagePattern('billing-term.create')
  async create(@Payload() dto: CreateBillingTermDto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('billing-term.update')
  async update(@Payload() data: { id: string } & UpdateBillingTermDto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('billing-term.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message pattern handlers here
  // CUSTOM_HANDLER_END: custom-handlers


}

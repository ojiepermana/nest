import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { BusinessEntityService } from '../services/business-entity.service';
import { CreateBusinessEntityDto } from '../dto/business-entity/create-business-entity.dto';
import { UpdateBusinessEntityDto } from '../dto/business-entity/update-business-entity.dto';
import { BusinessEntityFilterDto } from '../dto/business-entity/business-entity-filter.dto';

@Controller()
export class BusinessEntityController {
  constructor(private readonly service: BusinessEntityService) {}


  // GENERATED_HANDLER_START: findAll
  @MessagePattern('business-entity.findAll')
  async findAll(@Payload() filters: BusinessEntityFilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
  @MessagePattern('business-entity.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
  @MessagePattern('business-entity.create')
  async create(@Payload() dto: CreateBusinessEntityDto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('business-entity.update')
  async update(@Payload() data: { id: string } & UpdateBusinessEntityDto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('business-entity.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message pattern handlers here
  // CUSTOM_HANDLER_END: custom-handlers


}

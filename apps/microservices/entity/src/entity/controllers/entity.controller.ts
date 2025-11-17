import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EntityService } from '../services/entity.service';
import { CreateEntityDto } from '../dto/entity/create-entity.dto';
import { UpdateEntityDto } from '../dto/entity/update-entity.dto';
import { EntityFilterDto } from '../dto/entity/entity-filter.dto';

@Controller()
export class EntityController {
  constructor(private readonly service: EntityService) {}


  // GENERATED_HANDLER_START: findAll
  @MessagePattern('entity.findAll')
  async findAll(@Payload() filters: EntityFilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
  @MessagePattern('entity.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
  @MessagePattern('entity.create')
  async create(@Payload() dto: CreateEntityDto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('entity.update')
  async update(@Payload() data: { id: string } & UpdateEntityDto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('entity.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message pattern handlers here
  // CUSTOM_HANDLER_END: custom-handlers


}

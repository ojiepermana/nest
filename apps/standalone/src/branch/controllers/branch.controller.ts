import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';
import { BranchService } from '../services/branch.service';
import { CreateBranchDto } from '../dto/branch/create-branch.dto';
import { UpdateBranchDto } from '../dto/branch/update-branch.dto';
import { BranchFilterDto } from '../dto/branch/branch-filter.dto';

@Controller()
export class BranchController {
  constructor(private readonly service: BranchService) {}


  // GENERATED_HANDLER_START: findAll
  @MessagePattern('branch.findAll')
  async findAll(@Payload() filters: BranchFilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
  @MessagePattern('branch.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
  @MessagePattern('branch.create')
  async create(@Payload() dto: CreateBranchDto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('branch.update')
  async update(@Payload() data: { id: string } & UpdateBranchDto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('branch.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message pattern handlers here
  // CUSTOM_HANDLER_END: custom-handlers


}

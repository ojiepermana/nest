import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateEntityDto } from '../dto/entity/create-entity.dto';
import { UpdateEntityDto } from '../dto/entity/update-entity.dto';
import { EntityFilterDto } from '../dto/entity/entity-filter.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('entity')
@Controller('entity')
export class EntityController {
  constructor(
    @Inject('ENTITY_SERVICE')
    private readonly client: ClientProxy,
  ) {}


  // GENERATED_ENDPOINT_START: findAll
  @ApiOperation({ summary: 'Get all entitys' })
  
  @Get()
  async findAll(@Query() filters: EntityFilterDto) {
    return firstValueFrom(
      this.client.send('entity.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  @ApiOperation({ summary: 'Get yearly recap' })
  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('entity.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  @ApiOperation({ summary: 'Get single entity' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('entity.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  @ApiOperation({ summary: 'Create entity' })
  @Post()
  async create(@Body() dto: CreateEntityDto) {
    return firstValueFrom(
      this.client.send('entity.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @ApiOperation({ summary: 'Update entity' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEntityDto,
  ) {
    return firstValueFrom(
      this.client.send('entity.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @ApiOperation({ summary: 'Delete entity' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('entity.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints

}

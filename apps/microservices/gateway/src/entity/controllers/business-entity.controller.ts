import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateBusinessEntityDto } from '../dto/business-entity/create-business-entity.dto';
import { UpdateBusinessEntityDto } from '../dto/business-entity/update-business-entity.dto';
import { BusinessEntityFilterDto } from '../dto/business-entity/business-entity-filter.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('business-entity')
@Controller('business-entity')
export class BusinessEntityController {
  constructor(
    @Inject('ENTITY_SERVICE')
    private readonly client: ClientProxy,
  ) {}


  // GENERATED_ENDPOINT_START: findAll
  @ApiOperation({ summary: 'Get all businessentitys' })
  
  @Get()
  async findAll(@Query() filters: BusinessEntityFilterDto) {
    return firstValueFrom(
      this.client.send('business-entity.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  @ApiOperation({ summary: 'Get yearly recap' })
  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('business-entity.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  @ApiOperation({ summary: 'Get single businessentity' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('business-entity.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  @ApiOperation({ summary: 'Create businessentity' })
  @Post()
  async create(@Body() dto: CreateBusinessEntityDto) {
    return firstValueFrom(
      this.client.send('business-entity.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @ApiOperation({ summary: 'Update businessentity' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessEntityDto,
  ) {
    return firstValueFrom(
      this.client.send('business-entity.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @ApiOperation({ summary: 'Delete businessentity' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('business-entity.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints

}

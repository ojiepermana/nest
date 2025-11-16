import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateLocationTypeDto } from '../dto/location-type/create-location-type.dto';
import { UpdateLocationTypeDto } from '../dto/location-type/update-location-type.dto';
import { LocationTypeFilterDto } from '../dto/location-type/location-type-filter.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('location-type')
@Controller('location-type')
export class LocationTypeController {
  constructor(
    @Inject('LOCATION-TYPE_SERVICE')
    private readonly client: ClientProxy,
  ) {}


  // GENERATED_ENDPOINT_START: findAll
  @ApiOperation({ summary: 'Get all locationtypes' })
  
  @Get()
  async findAll(@Query() filters: LocationTypeFilterDto) {
    return firstValueFrom(
      this.client.send('location-type.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  @ApiOperation({ summary: 'Get yearly recap' })
  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('location-type.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  @ApiOperation({ summary: 'Get single locationtype' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('location-type.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  @ApiOperation({ summary: 'Create locationtype' })
  @Post()
  async create(@Body() dto: CreateLocationTypeDto) {
    return firstValueFrom(
      this.client.send('location-type.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @ApiOperation({ summary: 'Update locationtype' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationTypeDto,
  ) {
    return firstValueFrom(
      this.client.send('location-type.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @ApiOperation({ summary: 'Delete locationtype' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('location-type.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints

}

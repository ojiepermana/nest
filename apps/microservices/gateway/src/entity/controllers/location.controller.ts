import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateLocationDto } from '../dto/location/create-location.dto';
import { UpdateLocationDto } from '../dto/location/update-location.dto';
import { LocationFilterDto } from '../dto/location/location-filter.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(
    @Inject('ENTITY_SERVICE')
    private readonly client: ClientProxy,
  ) {}


  // GENERATED_ENDPOINT_START: findAll
  @ApiOperation({ summary: 'Get all locations' })
  
  @Get()
  async findAll(@Query() filters: LocationFilterDto) {
    return firstValueFrom(
      this.client.send('location.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  @ApiOperation({ summary: 'Get yearly recap' })
  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('location.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  @ApiOperation({ summary: 'Get single location' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('location.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  @ApiOperation({ summary: 'Create location' })
  @Post()
  async create(@Body() dto: CreateLocationDto) {
    return firstValueFrom(
      this.client.send('location.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @ApiOperation({ summary: 'Update location' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return firstValueFrom(
      this.client.send('location.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @ApiOperation({ summary: 'Delete location' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('location.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints

}

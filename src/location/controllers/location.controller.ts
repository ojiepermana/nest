import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { LocationService } from '../services/location.service';
import { Location } from '../entities/location.entity';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { LocationFilterDto } from '../dto/location-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RequirePermission } from '@ojiepermana/nest-generator/rbac';

@ApiTags('entity/location')
@Controller('entity/location')
export class LocationController {
  constructor(private readonly service: LocationService) {}


  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'The location has been successfully created.', type: Location })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateLocationDto })
  @RequirePermission('location.create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createDto: CreateLocationDto): Promise<Location> {
    return this.service.create(createDto);
  }

  @ApiOperation({ summary: 'Get all locations with pagination' })
  @ApiResponse({ status: 200, description: 'Return all locations with pagination.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort field and order (e.g., name:ASC)' })
  @RequirePermission('location.read')
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: Location[]; total: number; page: number; limit: number }> {
    const sortOptions = sort
      ? sort.split(',').map((s) => {
          const [field, order] = s.split(':');
          return { field, order: (order?.toUpperCase() || 'ASC') as 'ASC' | 'DESC' };
        })
      : undefined;

    return this.service.findWithFilters({}, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sortOptions,
    });
  }

  @ApiOperation({ summary: 'Get locations with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Return filtered locations with pagination.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort field and order (e.g., name:ASC)' })
  @Get('filter')
  async findWithFilters(
    @Query() filterDto: LocationFilterDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: Location[]; total: number; page: number; limit: number }> {
    const sortOptions = sort
      ? sort.split(',').map((s) => {
          const [field, order] = s.split(':');
          return { field, order: (order?.toUpperCase() || 'ASC') as 'ASC' | 'DESC' };
        })
      : undefined;

    return this.service.findWithFilters(filterDto, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sortOptions,
    });
  }

  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiResponse({ status: 200, description: 'Return the location.', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  @ApiParam({ name: 'id', type: String, description: 'Location ID' })
  @RequirePermission('location.read')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Location> {
    const location = await this.service.findOne(id);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({ status: 200, description: 'The location has been successfully updated.', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiParam({ name: 'id', type: String, description: 'Location ID' })
  @ApiBody({ type: UpdateLocationDto })
  @RequirePermission('location.update')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateLocationDto,
  ): Promise<Location> {
    return this.service.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a location' })
  @ApiResponse({ status: 204, description: 'The location has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  @ApiParam({ name: 'id', type: String, description: 'Location ID' })
  @RequirePermission('location.delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }

}

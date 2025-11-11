import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityService } from '../services/entity.service';
import { Entity } from '../entities/entity.entity';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityFilterDto } from '../dto/entity-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RequirePermission } from '@ojiepermana/nest-generator/rbac';

@ApiTags('entity/entity')
@Controller('entity/entity')
export class EntityController {
  constructor(private readonly service: EntityService) {}

  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({
    status: 201,
    description: 'The entity has been successfully created.',
    type: Entity,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateEntityDto })
  @RequirePermission('entity.create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createDto: CreateEntityDto): Promise<Entity> {
    return this.service.create(createDto);
  }

  @ApiOperation({ summary: 'Get all entitys with pagination' })
  @ApiResponse({ status: 200, description: 'Return all entitys with pagination.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort field and order (e.g., name:ASC)',
  })
  @RequirePermission('entity.read')
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: Entity[]; total: number; page: number; limit: number }> {
    const sortOptions = sort
      ? sort.split(',').map((s) => {
          const [field, order] = s.split(':');
          return { field, order: (order?.toUpperCase() || 'ASC') as 'ASC' | 'DESC' };
        })
      : undefined;

    return this.service.findWithFilters(
      {},
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sort: sortOptions,
      },
    );
  }

  @ApiOperation({ summary: 'Get entitys with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Return filtered entitys with pagination.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'Sort field and order (e.g., name:ASC)',
  })
  @Get('filter')
  async findWithFilters(
    @Query() filterDto: EntityFilterDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: Entity[]; total: number; page: number; limit: number }> {
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

  @ApiOperation({ summary: 'Get a entity by ID' })
  @ApiResponse({ status: 200, description: 'Return the entity.', type: Entity })
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  @ApiParam({ name: 'id', type: String, description: 'Entity ID' })
  @RequirePermission('entity.read')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Entity> {
    const entity = await this.service.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  @ApiOperation({ summary: 'Update a entity' })
  @ApiResponse({
    status: 200,
    description: 'The entity has been successfully updated.',
    type: Entity,
  })
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiParam({ name: 'id', type: String, description: 'Entity ID' })
  @ApiBody({ type: UpdateEntityDto })
  @RequirePermission('entity.update')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateEntityDto,
  ): Promise<Entity> {
    return this.service.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a entity' })
  @ApiResponse({ status: 204, description: 'The entity has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Entity not found.' })
  @ApiParam({ name: 'id', type: String, description: 'Entity ID' })
  @RequirePermission('entity.delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}

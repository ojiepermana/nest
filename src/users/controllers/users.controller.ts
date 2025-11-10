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
  ParseIntPipe,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { Users } from '../entities/users.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersFilterDto } from '../dto/users-filter.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @ApiOperation({ summary: 'Create a new users' })
  @ApiResponse({
    status: 201,
    description: 'The users has been successfully created.',
    type: Users,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: CreateUsersDto })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createDto: CreateUsersDto): Promise<Users> {
    return this.service.create(createDto);
  }

  @ApiOperation({ summary: 'Get all userss' })
  @ApiResponse({ status: 200, description: 'Return all userss.', type: [Users] })
  @Get()
  async findAll(): Promise<Users[]> {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get userss with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Return filtered userss with pagination.' })
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
    @Query() filterDto: UsersFilterDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: Users[]; total: number; page: number; limit: number }> {
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

  @ApiOperation({ summary: 'Get a users by ID' })
  @ApiResponse({ status: 200, description: 'Return the users.', type: Users })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @ApiParam({ name: 'id', type: Number, description: 'Users ID' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Users> {
    const users = await this.service.findOne(id);
    if (!users) {
      throw new NotFoundException(`Users with ID ${id} not found`);
    }
    return users;
  }

  @ApiOperation({ summary: 'Update a users' })
  @ApiResponse({
    status: 200,
    description: 'The users has been successfully updated.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiParam({ name: 'id', type: Number, description: 'Users ID' })
  @ApiBody({ type: UpdateUsersDto })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateUsersDto,
  ): Promise<Users> {
    return this.service.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a users' })
  @ApiResponse({ status: 204, description: 'The users has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @ApiParam({ name: 'id', type: Number, description: 'Users ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}

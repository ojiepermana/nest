import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Swagger decorator for paginated responses
 * Generates proper OpenAPI schema for PaginatedResult
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  currentPage: { type: 'number', example: 1 },
                  perPage: { type: 'number', example: 10 },
                  totalItems: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 10 },
                  hasPreviousPage: { type: 'boolean', example: false },
                  hasNextPage: { type: 'boolean', example: true },
                  firstItemIndex: { type: 'number', example: 1 },
                  lastItemIndex: { type: 'number', example: 10 },
                },
              },
              links: {
                type: 'object',
                properties: {
                  first: { type: 'string', example: '/api/resource?page=1' },
                  previous: {
                    type: 'string',
                    nullable: true,
                    example: null,
                  },
                  current: { type: 'string', example: '/api/resource?page=1' },
                  next: { type: 'string', example: '/api/resource?page=2' },
                  last: {
                    type: 'string',
                    example: '/api/resource?page=10',
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * File Upload Generator
 *
 * Generates file upload endpoints with Multer integration
 * Supports: Single/Multiple files, validation, size limits, type restrictions
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface FileUploadConfig {
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  destination?: string;
  preserveOriginalName?: boolean;
  generateThumbnails?: boolean;
  thumbnailSizes?: Array<{ width: number; height: number }>;
}

export interface FileUploadGeneratorOptions {
  tableName: string;
  entityName?: string;
  storageProvider?: 'local' | 's3' | 'gcs' | 'azure';
  enableValidation?: boolean;
  enableSwagger?: boolean;
}

export class FileUploadGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: FileUploadGeneratorOptions,
  ) {}

  /**
   * Generate file upload controller methods
   */
  generateUploadEndpoints(): string {
    const fileColumns = this.getFileUploadColumns();

    if (fileColumns.length === 0) {
      return '';
    }

    const methods: string[] = [];

    for (const column of fileColumns) {
      const config = this.parseFileUploadConfig(column);

      if (config.maxFiles && config.maxFiles > 1) {
        methods.push(this.generateMultipleFileUploadEndpoint(column, config));
      } else {
        methods.push(this.generateSingleFileUploadEndpoint(column, config));
      }

      methods.push(this.generateFileDeleteEndpoint(column));
    }

    return methods.join('\n\n');
  }

  /**
   * Generate single file upload endpoint
   */
  private generateSingleFileUploadEndpoint(
    column: ColumnMetadata,
    config: FileUploadConfig,
  ): string {
    const fieldName = column.column_name;
    const camelFieldName = toCamelCase(fieldName);

    const swaggerDecorators = this.options.enableSwagger
      ? this.generateSwaggerDecorators('single', camelFieldName)
      : '';

    const multerOptions = this.generateMulterOptions(config);

    return `  ${swaggerDecorators}@Post('upload/${camelFieldName}')
  @UseInterceptors(FileInterceptor('file', ${multerOptions}))
  async upload${toPascalCase(camelFieldName)}(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityId') entityId: string,
  ): Promise<{ url: string; filename: string; size: number }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Upload to storage
    const url = await this.storageService.upload(file, {
      folder: '${this.options.tableName}/${camelFieldName}',
      entityId,
    });

    // Update entity
    await this.service.update(entityId, {
      ${fieldName}: url,
    } as any);

    return {
      url,
      filename: file.originalname,
      size: file.size,
    };
  }`;
  }

  /**
   * Generate multiple file upload endpoint
   */
  private generateMultipleFileUploadEndpoint(
    column: ColumnMetadata,
    config: FileUploadConfig,
  ): string {
    const fieldName = column.column_name;
    const camelFieldName = toCamelCase(fieldName);
    const maxFiles = config.maxFiles || 10;

    const swaggerDecorators = this.options.enableSwagger
      ? this.generateSwaggerDecorators('multiple', camelFieldName, maxFiles)
      : '';

    const multerOptions = this.generateMulterOptions(config);

    return `  ${swaggerDecorators}@Post('upload/${camelFieldName}')
  @UseInterceptors(FilesInterceptor('files', ${maxFiles}, ${multerOptions}))
  async upload${toPascalCase(camelFieldName)}(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('entityId') entityId: string,
  ): Promise<{ urls: string[]; count: number }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload all files to storage
    const uploadPromises = files.map((file) =>
      this.storageService.upload(file, {
        folder: '${this.options.tableName}/${camelFieldName}',
        entityId,
      }),
    );

    const urls = await Promise.all(uploadPromises);

    // Update entity
    await this.service.update(entityId, {
      ${fieldName}: urls,
    } as any);

    return {
      urls,
      count: urls.length,
    };
  }`;
  }

  /**
   * Generate file delete endpoint
   */
  private generateFileDeleteEndpoint(column: ColumnMetadata): string {
    const fieldName = column.column_name;
    const camelFieldName = toCamelCase(fieldName);

    const swaggerDecorators = this.options.enableSwagger
      ? `  @ApiOperation({ summary: 'Delete ${camelFieldName} file' })
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  `
      : '';

    return `  ${swaggerDecorators}@Delete(':id/${camelFieldName}')
  async delete${toPascalCase(camelFieldName)}(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const entity = await this.service.findOne(id);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const fileUrl = entity.${fieldName};
    if (fileUrl) {
      // Delete from storage
      await this.storageService.delete(fileUrl);

      // Update entity
      await this.service.update(id, {
        ${fieldName}: null,
      } as any);
    }

    return { message: 'File deleted successfully' };
  }`;
  }

  /**
   * Generate Multer options object
   */
  private generateMulterOptions(config: FileUploadConfig): string {
    const options: string[] = [];

    // File size limit
    if (config.maxFileSize) {
      options.push(`limits: { fileSize: ${config.maxFileSize} }`);
    }

    // File filter (mime types)
    if (config.allowedMimeTypes && config.allowedMimeTypes.length > 0) {
      const mimeTypes = config.allowedMimeTypes
        .map((type) => `'${type}'`)
        .join(', ');
      options.push(`fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [${mimeTypes}];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(\`File type not allowed. Allowed types: \${allowedMimeTypes.join(', ')}\`), false);
      }
      cb(null, true);
    }`);
    }

    // File extension filter
    if (config.allowedExtensions && config.allowedExtensions.length > 0) {
      const extensions = config.allowedExtensions
        .map((ext) => `'${ext}'`)
        .join(', ');
      options.push(`fileFilter: (req, file, cb) => {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      const allowedExtensions = [${extensions}];
      if (!ext || !allowedExtensions.includes(ext)) {
        return cb(new BadRequestException(\`File extension not allowed. Allowed extensions: \${allowedExtensions.join(', ')}\`), false);
      }
      cb(null, true);
    }`);
    }

    if (options.length === 0) {
      return '{}';
    }

    return `{\n    ${options.join(',\n    ')}\n  }`;
  }

  /**
   * Generate Swagger decorators for upload endpoints
   */
  private generateSwaggerDecorators(
    type: 'single' | 'multiple',
    fieldName: string,
    maxFiles?: number,
  ): string {
    if (type === 'single') {
      return `@ApiOperation({ summary: 'Upload ${fieldName} file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityId: {
          type: 'string',
          description: 'Entity ID to attach file to',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  `;
    } else {
      return `@ApiOperation({ summary: 'Upload multiple ${fieldName} files (max ${maxFiles})' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          maxItems: ${maxFiles},
        },
        entityId: {
          type: 'string',
          description: 'Entity ID to attach files to',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  `;
    }
  }

  /**
   * Generate required imports for file upload
   */
  generateImports(): string {
    const imports: string[] = [];

    // NestJS imports
    imports.push(
      "import { UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, NotFoundException } from '@nestjs/common';",
    );
    imports.push(
      "import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';",
    );

    // Swagger imports
    if (this.options.enableSwagger) {
      imports.push(
        "import { ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';",
      );
    }

    // Storage service import
    imports.push(
      "import { StorageService } from '../services/storage.service';",
    );

    return imports.join('\n');
  }

  /**
   * Get columns that have file upload enabled
   */
  private getFileUploadColumns(): ColumnMetadata[] {
    return this.columns.filter((col) => col.is_file_upload === true);
  }

  /**
   * Parse file upload configuration from column metadata
   */
  private parseFileUploadConfig(column: ColumnMetadata): FileUploadConfig {
    if (!column.file_upload_config) {
      return {
        maxFileSize: 5242880, // 5MB default
        maxFiles: 1,
        allowedMimeTypes: [],
      };
    }

    const config = column.file_upload_config as FileUploadConfig;

    return {
      maxFileSize: config.maxFileSize || 5242880,
      maxFiles: config.maxFiles || 1,
      allowedMimeTypes: config.allowedMimeTypes || [],
      allowedExtensions: config.allowedExtensions || [],
      destination: config.destination || 'uploads',
      preserveOriginalName: config.preserveOriginalName ?? false,
      generateThumbnails: config.generateThumbnails ?? false,
      thumbnailSizes: config.thumbnailSizes || [],
    };
  }

  /**
   * Check if any columns have file upload enabled
   */
  hasFileUploadColumns(): boolean {
    return this.getFileUploadColumns().length > 0;
  }

  /**
   * Generate storage service injection in controller constructor
   */
  generateStorageServiceInjection(): string {
    if (!this.hasFileUploadColumns()) {
      return '';
    }

    return 'private readonly storageService: StorageService';
  }
}

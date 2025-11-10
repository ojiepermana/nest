/**
 * File Upload Generator Tests
 *
 * Comprehensive tests for file upload generation
 */

import { FileUploadGenerator } from './file-upload.generator';
import { StorageServiceGenerator } from './storage-service.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

describe('FileUploadGenerator', () => {
  let tableMetadata: TableMetadata;
  let columns: ColumnMetadata[];

  beforeEach(() => {
    tableMetadata = {
      id: '123',
      schema_name: 'public',
      table_name: 'users',
      table_type: 'TABLE' as any,
      table_purpose: 'User management',
      has_soft_delete: false,
      has_created_by: true,
      primary_key_column: 'id',
      primary_key_type: 'uuid',
      is_partitioned: false,
      model_class: 'Users',
      controller_class: 'UsersController',
      request_class: 'UsersDto',
      resource_class: 'UsersResource',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      updated_by: 'system',
    };

    columns = [
      {
        id: '1',
        table_metadata_id: '123',
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: false,
        is_unique: true,
        is_primary_key: true,
        is_required: true,
        is_filterable: true,
        is_searchable: false,
        display_in_list: true,
        display_in_form: false,
        display_in_detail: true,
        column_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      },
    ];
  });

  describe('Single File Upload', () => {
    beforeEach(() => {
      columns.push({
        id: '2',
        table_metadata_id: '123',
        column_name: 'avatar',
        data_type: 'varchar',
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_required: false,
        is_filterable: false,
        is_searchable: false,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        is_file_upload: true,
        file_upload_config: {
          maxFileSize: 5242880, // 5MB
          maxFiles: 1,
          allowedMimeTypes: ['image/jpeg', 'image/png'],
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      });
    });

    it('should detect file upload columns', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      expect(generator.hasFileUploadColumns()).toBe(true);
    });

    it('should generate single file upload endpoint', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
        enableSwagger: true,
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain("@Post('upload/avatar')");
      expect(code).toContain('FileInterceptor');
      expect(code).toContain('uploadAvatar');
      expect(code).toContain('@UploadedFile()');
    });

    it('should generate file size validation', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('limits: { fileSize: 5242880 }');
    });

    it('should generate mime type validation', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('allowedMimeTypes');
      expect(code).toContain('image/jpeg');
      expect(code).toContain('image/png');
    });

    it('should generate delete endpoint', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('@Delete');
      expect(code).toContain('deleteAvatar');
      expect(code).toContain('storageService.delete');
    });

    it('should generate Swagger decorators when enabled', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
        enableSwagger: true,
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('@ApiOperation');
      expect(code).toContain("@ApiConsumes('multipart/form-data')");
      expect(code).toContain('@ApiBody');
      expect(code).toContain("format: 'binary'");
    });
  });

  describe('Multiple Files Upload', () => {
    beforeEach(() => {
      columns.push({
        id: '3',
        table_metadata_id: '123',
        column_name: 'documents',
        data_type: 'jsonb',
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_required: false,
        is_filterable: false,
        is_searchable: false,
        display_in_list: false,
        display_in_form: true,
        display_in_detail: true,
        column_order: 3,
        is_file_upload: true,
        file_upload_config: {
          maxFileSize: 10485760, // 10MB
          maxFiles: 5,
          allowedMimeTypes: ['application/pdf', 'image/jpeg'],
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      });
    });

    it('should generate multiple files upload endpoint', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 's3',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('FilesInterceptor');
      expect(code).toContain("'files', 5");
      expect(code).toContain('@UploadedFiles()');
      expect(code).toContain('Express.Multer.File[]');
    });

    it('should generate parallel upload logic', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 's3',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toContain('uploadPromises');
      expect(code).toContain('Promise.all');
      expect(code).toContain('files.map');
    });
  });

  describe('Import Generation', () => {
    it('should generate required imports', () => {
      columns.push({
        id: '2',
        table_metadata_id: '123',
        column_name: 'avatar',
        data_type: 'varchar',
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_required: false,
        is_filterable: false,
        is_searchable: false,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        is_file_upload: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      });

      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const imports = generator.generateImports();

      expect(imports).toContain('UseInterceptors');
      expect(imports).toContain('UploadedFile');
      expect(imports).toContain('FileInterceptor');
      expect(imports).toContain('StorageService');
    });

    it('should generate Swagger imports when enabled', () => {
      columns.push({
        id: '2',
        table_metadata_id: '123',
        column_name: 'avatar',
        data_type: 'varchar',
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_required: false,
        is_filterable: false,
        is_searchable: false,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        is_file_upload: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      });

      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
        enableSwagger: true,
      });

      const imports = generator.generateImports();

      expect(imports).toContain('ApiOperation');
      expect(imports).toContain('ApiConsumes');
      expect(imports).toContain('ApiBody');
    });
  });

  describe('Storage Service Injection', () => {
    it('should generate storage service injection', () => {
      columns.push({
        id: '2',
        table_metadata_id: '123',
        column_name: 'avatar',
        data_type: 'varchar',
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_required: false,
        is_filterable: false,
        is_searchable: false,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        is_file_upload: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      });

      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const injection = generator.generateStorageServiceInjection();

      expect(injection).toContain('storageService');
      expect(injection).toContain('StorageService');
    });

    it('should return empty string when no file upload columns', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const injection = generator.generateStorageServiceInjection();

      expect(injection).toBe('');
    });
  });

  describe('No File Upload Columns', () => {
    it('should return empty endpoints when no file columns', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      const code = generator.generateUploadEndpoints();

      expect(code).toBe('');
    });

    it('should return false for hasFileUploadColumns', () => {
      const generator = new FileUploadGenerator(tableMetadata, columns, {
        tableName: 'users',
        storageProvider: 'local',
      });

      expect(generator.hasFileUploadColumns()).toBe(false);
    });
  });
});

describe('StorageServiceGenerator', () => {
  describe('Local Storage', () => {
    it('should generate local storage service', () => {
      const generator = new StorageServiceGenerator({
        provider: 'local',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('class StorageService');
      expect(code).toContain('async upload');
      expect(code).toContain('async delete');
      expect(code).toContain('fs.writeFile');
    });

    it('should generate local file system imports', () => {
      const generator = new StorageServiceGenerator({
        provider: 'local',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('import { promises as fs }');
      expect(code).toContain("from 'fs'");
    });
  });

  describe('S3 Storage', () => {
    it('should generate S3 storage service', () => {
      const generator = new StorageServiceGenerator({
        provider: 's3',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('S3Client');
      expect(code).toContain('PutObjectCommand');
      expect(code).toContain('DeleteObjectCommand');
      expect(code).toContain('getSignedUrl');
    });

    it('should generate S3 imports', () => {
      const generator = new StorageServiceGenerator({
        provider: 's3',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('@aws-sdk/client-s3');
      expect(code).toContain('@aws-sdk/s3-request-presigner');
    });

    it('should generate environment variable docs for S3', () => {
      const generator = new StorageServiceGenerator({
        provider: 's3',
        tableName: 'users',
      });

      const envDocs = generator.generateEnvDocs();

      expect(envDocs).toContain('AWS_REGION');
      expect(envDocs).toContain('AWS_ACCESS_KEY_ID');
      expect(envDocs).toContain('AWS_SECRET_ACCESS_KEY');
      expect(envDocs).toContain('AWS_S3_BUCKET');
    });

    it('should generate S3 dependencies', () => {
      const generator = new StorageServiceGenerator({
        provider: 's3',
        tableName: 'users',
      });

      const deps = generator.generateDependencies();

      expect(deps['@aws-sdk/client-s3']).toBeDefined();
      expect(deps['@aws-sdk/s3-request-presigner']).toBeDefined();
    });
  });

  describe('GCS Storage', () => {
    it('should generate GCS storage service', () => {
      const generator = new StorageServiceGenerator({
        provider: 'gcs',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('Storage');
      expect(code).toContain('@google-cloud/storage');
      expect(code).toContain('bucket.file');
    });

    it('should generate GCS dependencies', () => {
      const generator = new StorageServiceGenerator({
        provider: 'gcs',
        tableName: 'users',
      });

      const deps = generator.generateDependencies();

      expect(deps['@google-cloud/storage']).toBeDefined();
    });
  });

  describe('Azure Storage', () => {
    it('should generate Azure storage service', () => {
      const generator = new StorageServiceGenerator({
        provider: 'azure',
        tableName: 'users',
      });

      const code = generator.generate();

      expect(code).toContain('BlobServiceClient');
      expect(code).toContain('@azure/storage-blob');
      expect(code).toContain('blockBlobClient');
    });

    it('should generate Azure dependencies', () => {
      const generator = new StorageServiceGenerator({
        provider: 'azure',
        tableName: 'users',
      });

      const deps = generator.generateDependencies();

      expect(deps['@azure/storage-blob']).toBeDefined();
    });
  });

  describe('Common Features', () => {
    it('should include ConfigService in all providers', () => {
      const providers: Array<'local' | 's3' | 'gcs' | 'azure'> = ['local', 's3', 'gcs', 'azure'];

      providers.forEach((provider) => {
        const generator = new StorageServiceGenerator({
          provider,
          tableName: 'users',
        });

        const code = generator.generate();
        expect(code).toContain('ConfigService');
      });
    });

    it('should include upload method in all providers', () => {
      const providers: Array<'local' | 's3' | 'gcs' | 'azure'> = ['local', 's3', 'gcs', 'azure'];

      providers.forEach((provider) => {
        const generator = new StorageServiceGenerator({
          provider,
          tableName: 'users',
        });

        const code = generator.generate();
        expect(code).toContain('async upload');
      });
    });

    it('should include delete method in all providers', () => {
      const providers: Array<'local' | 's3' | 'gcs' | 'azure'> = ['local', 's3', 'gcs', 'azure'];

      providers.forEach((provider) => {
        const generator = new StorageServiceGenerator({
          provider,
          tableName: 'users',
        });

        const code = generator.generate();
        expect(code).toContain('async delete');
      });
    });
  });
});

/**
 * Storage Service Generator
 *
 * Generates storage service for file uploads with multiple provider support:
 * - Local filesystem
 * - AWS S3
 * - Google Cloud Storage (GCS)
 * - Azure Blob Storage
 */

export interface StorageServiceGeneratorOptions {
  provider: 'local' | 's3' | 'gcs' | 'azure';
  tableName: string;
  entityName?: string;
}

export class StorageServiceGenerator {
  constructor(private options: StorageServiceGeneratorOptions) {}

  /**
   * Generate complete storage service
   */
  generate(): string {
    const imports = this.generateImports();
    const classDeclaration = this.generateClassDeclaration();
    const constructor = this.generateConstructor();
    const methods = this.generateMethods();

    return `${imports}

${classDeclaration}
${constructor}
${methods}
}
`;
  }

  /**
   * Generate imports based on provider
   */
  private generateImports(): string {
    const imports: string[] = [
      "import { Injectable, Logger } from '@nestjs/common';",
      "import { ConfigService } from '@nestjs/config';",
    ];

    switch (this.options.provider) {
      case 's3':
        imports.push(
          "import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';",
          "import { getSignedUrl } from '@aws-sdk/s3-request-presigner';",
        );
        break;
      case 'gcs':
        imports.push("import { Storage } from '@google-cloud/storage';");
        break;
      case 'azure':
        imports.push(
          "import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';",
        );
        break;
      case 'local':
        imports.push(
          "import { promises as fs } from 'fs';",
          "import { join } from 'path';",
          "import { createWriteStream } from 'fs';",
          "import { pipeline } from 'stream/promises';",
        );
        break;
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(): string {
    return `@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);`;
  }

  /**
   * Generate constructor with provider-specific initialization
   */
  private generateConstructor(): string {
    let constructorBody = '';

    switch (this.options.provider) {
      case 's3':
        constructorBody = `  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = this.configService.get('AWS_S3_BUCKET');
  }`;
        break;

      case 'gcs':
        constructorBody = `  private storage: Storage;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get('GCS_PROJECT_ID'),
      keyFilename: this.configService.get('GCS_KEY_FILE'),
    });
    this.bucket = this.configService.get('GCS_BUCKET');
  }`;
        break;

      case 'azure':
        constructorBody = `  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(private configService: ConfigService) {
    const accountName = this.configService.get('AZURE_STORAGE_ACCOUNT');
    const accountKey = this.configService.get('AZURE_STORAGE_KEY');
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    this.blobServiceClient = new BlobServiceClient(
      \`https://\${accountName}.blob.core.windows.net\`,
      sharedKeyCredential,
    );
    this.containerName = this.configService.get('AZURE_CONTAINER_NAME');
  }`;
        break;

      case 'local':
        constructorBody = `  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || 'uploads';
  }`;
        break;
    }

    return constructorBody;
  }

  /**
   * Generate all service methods
   */
  private generateMethods(): string {
    const methods: string[] = [];

    methods.push(this.generateUploadMethod());
    methods.push(this.generateDeleteMethod());
    methods.push(this.generateGetUrlMethod());
    methods.push(this.generateGetFileMethod());

    return methods.join('\n\n');
  }

  /**
   * Generate upload method
   */
  private generateUploadMethod(): string {
    switch (this.options.provider) {
      case 's3':
        return `  /**
   * Upload file to S3
   */
  async upload(
    file: Express.Multer.File,
    options?: { folder?: string; entityId?: string },
  ): Promise<string> {
    const folder = options?.folder || 'files';
    const filename = \`\${folder}/\${Date.now()}-\${file.originalname}\`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      const url = \`https://\${this.bucket}.s3.amazonaws.com/\${filename}\`;
      this.logger.log(\`File uploaded to S3: \${url}\`);
      return url;
    } catch (error) {
      this.logger.error(\`Failed to upload to S3: \${error.message}\`);
      throw error;
    }
  }`;

      case 'gcs':
        return `  /**
   * Upload file to Google Cloud Storage
   */
  async upload(
    file: Express.Multer.File,
    options?: { folder?: string; entityId?: string },
  ): Promise<string> {
    const folder = options?.folder || 'files';
    const filename = \`\${folder}/\${Date.now()}-\${file.originalname}\`;

    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(filename);

    try {
      await blob.save(file.buffer, {
        contentType: file.mimetype,
        metadata: {
          entityId: options?.entityId,
        },
      });

      const url = \`https://storage.googleapis.com/\${this.bucket}/\${filename}\`;
      this.logger.log(\`File uploaded to GCS: \${url}\`);
      return url;
    } catch (error) {
      this.logger.error(\`Failed to upload to GCS: \${error.message}\`);
      throw error;
    }
  }`;

      case 'azure':
        return `  /**
   * Upload file to Azure Blob Storage
   */
  async upload(
    file: Express.Multer.File,
    options?: { folder?: string; entityId?: string },
  ): Promise<string> {
    const folder = options?.folder || 'files';
    const filename = \`\${folder}/\${Date.now()}-\${file.originalname}\`;

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    try {
      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
        metadata: {
          entityId: options?.entityId || '',
        },
      });

      const url = blockBlobClient.url;
      this.logger.log(\`File uploaded to Azure: \${url}\`);
      return url;
    } catch (error) {
      this.logger.error(\`Failed to upload to Azure: \${error.message}\`);
      throw error;
    }
  }`;

      case 'local':
        return `  /**
   * Upload file to local filesystem
   */
  async upload(
    file: Express.Multer.File,
    options?: { folder?: string; entityId?: string },
  ): Promise<string> {
    const folder = options?.folder || 'files';
    const uploadPath = join(this.uploadDir, folder);
    const filename = \`\${Date.now()}-\${file.originalname}\`;
    const filePath = join(uploadPath, filename);

    try {
      // Create directory if not exists
      await fs.mkdir(uploadPath, { recursive: true });

      // Write file
      await fs.writeFile(filePath, file.buffer);

      const url = \`/uploads/\${folder}/\${filename}\`;
      this.logger.log(\`File uploaded locally: \${url}\`);
      return url;
    } catch (error) {
      this.logger.error(\`Failed to upload locally: \${error.message}\`);
      throw error;
    }
  }`;

      default:
        return '';
    }
  }

  /**
   * Generate delete method
   */
  private generateDeleteMethod(): string {
    switch (this.options.provider) {
      case 's3':
        return `  /**
   * Delete file from S3
   */
  async delete(url: string): Promise<void> {
    // Extract key from URL
    const key = url.split('.com/')[1];

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(\`File deleted from S3: \${key}\`);
    } catch (error) {
      this.logger.error(\`Failed to delete from S3: \${error.message}\`);
      throw error;
    }
  }`;

      case 'gcs':
        return `  /**
   * Delete file from Google Cloud Storage
   */
  async delete(url: string): Promise<void> {
    // Extract filename from URL
    const filename = url.split(\`/\${this.bucket}/\`)[1];

    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(filename);

    try {
      await file.delete();
      this.logger.log(\`File deleted from GCS: \${filename}\`);
    } catch (error) {
      this.logger.error(\`Failed to delete from GCS: \${error.message}\`);
      throw error;
    }
  }`;

      case 'azure':
        return `  /**
   * Delete file from Azure Blob Storage
   */
  async delete(url: string): Promise<void> {
    // Extract blob name from URL
    const blobName = url.split(\`/\${this.containerName}/\`)[1];

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.delete();
      this.logger.log(\`File deleted from Azure: \${blobName}\`);
    } catch (error) {
      this.logger.error(\`Failed to delete from Azure: \${error.message}\`);
      throw error;
    }
  }`;

      case 'local':
        return `  /**
   * Delete file from local filesystem
   */
  async delete(url: string): Promise<void> {
    // Remove leading slash and get file path
    const relativePath = url.startsWith('/') ? url.substring(1) : url;
    const filePath = join(process.cwd(), relativePath);

    try {
      await fs.unlink(filePath);
      this.logger.log(\`File deleted locally: \${filePath}\`);
    } catch (error) {
      this.logger.error(\`Failed to delete locally: \${error.message}\`);
      throw error;
    }
  }`;

      default:
        return '';
    }
  }

  /**
   * Generate getUrl method for signed URLs (S3/GCS) or public URLs
   */
  private generateGetUrlMethod(): string {
    switch (this.options.provider) {
      case 's3':
        return `  /**
   * Get signed URL for private S3 object
   */
  async getUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(\`Failed to generate signed URL: \${error.message}\`);
      throw error;
    }
  }`;

      case 'gcs':
        return `  /**
   * Get signed URL for private GCS object
   */
  async getUrl(filename: string, expiresIn: number = 3600): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(filename);

    try {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
      return url;
    } catch (error) {
      this.logger.error(\`Failed to generate signed URL: \${error.message}\`);
      throw error;
    }
  }`;

      case 'azure':
      case 'local':
        return `  /**
   * Get public URL for file
   */
  async getUrl(url: string): Promise<string> {
    return url;
  }`;

      default:
        return '';
    }
  }

  /**
   * Generate getFile method to retrieve file buffer
   */
  private generateGetFileMethod(): string {
    return `  /**
   * Get file buffer (for processing/transformation)
   */
  async getFile(url: string): Promise<Buffer> {
    // Implementation varies by provider
    // This is a placeholder - implement based on your needs
    throw new Error('Not implemented');
  }`;
  }

  /**
   * Generate environment variables documentation
   */
  generateEnvDocs(): string {
    const docs: string[] = ['# Storage Service Configuration\n'];

    switch (this.options.provider) {
      case 's3':
        docs.push('AWS_REGION=us-east-1');
        docs.push('AWS_ACCESS_KEY_ID=your_access_key');
        docs.push('AWS_SECRET_ACCESS_KEY=your_secret_key');
        docs.push('AWS_S3_BUCKET=your_bucket_name');
        break;
      case 'gcs':
        docs.push('GCS_PROJECT_ID=your_project_id');
        docs.push('GCS_KEY_FILE=/path/to/service-account-key.json');
        docs.push('GCS_BUCKET=your_bucket_name');
        break;
      case 'azure':
        docs.push('AZURE_STORAGE_ACCOUNT=your_account_name');
        docs.push('AZURE_STORAGE_KEY=your_account_key');
        docs.push('AZURE_CONTAINER_NAME=your_container_name');
        break;
      case 'local':
        docs.push('UPLOAD_DIR=uploads');
        break;
    }

    return docs.join('\n');
  }

  /**
   * Generate package.json dependencies
   */
  generateDependencies(): Record<string, string> {
    const deps: Record<string, string> = {
      '@nestjs/config': '^10.0.0',
    };

    switch (this.options.provider) {
      case 's3':
        deps['@aws-sdk/client-s3'] = '^3.400.0';
        deps['@aws-sdk/s3-request-presigner'] = '^3.400.0';
        break;
      case 'gcs':
        deps['@google-cloud/storage'] = '^7.0.0';
        break;
      case 'azure':
        deps['@azure/storage-blob'] = '^12.15.0';
        break;
    }

    return deps;
  }
}

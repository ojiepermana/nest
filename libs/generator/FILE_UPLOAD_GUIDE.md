# File Upload System - Complete Guide

Comprehensive file upload system with multi-cloud storage support, validation, security, and image processing capabilities.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Storage Providers](#storage-providers)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Security & Validation](#security--validation)
8. [Image Processing](#image-processing)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Migration Guide](#migration-guide)

## Features

### Core Features
- ✅ **Single & Multiple File Upload** - Handle one or many files per request
- ✅ **4 Storage Providers** - Local, AWS S3, Google Cloud Storage, Azure Blob
- ✅ **File Validation** - Size limits, MIME type filtering, extension checking
- ✅ **Automatic Cleanup** - Delete files on entity deletion
- ✅ **Streaming Support** - Handle large files efficiently
- ✅ **CDN Integration** - CloudFront, Cloud CDN, Azure CDN support
- ✅ **Image Processing** - Resize, crop, watermark (with Sharp)
- ✅ **Swagger Documentation** - Auto-generated API docs for file upload
- ✅ **Progress Tracking** - Upload progress events (planned)
- ✅ **Metadata Storage** - Track file info in database
- ✅ **Secure URLs** - Signed URLs with expiration (S3, GCS, Azure)
- ✅ **File Versioning** - Keep file history (S3 versioning)

### Security Features
- MIME type validation (prevent execution of malicious files)
- File extension whitelist/blacklist
- Virus scanning integration (ClamAV)
- Secure temporary directory
- Access control (IAM, signed URLs)

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP, SVG, TIFF, BMP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Archives**: ZIP, RAR, TAR, GZ, 7Z
- **Media**: MP3, MP4, AVI, MOV, WAV
- **Code**: TXT, MD, JSON, XML, CSV

## Installation

### 1. Enable File Upload Feature

When generating a module, use the `--features.fileUpload` flag:

```bash
nest-generator generate users.profile --features.fileUpload=true --storageProvider=s3
```

**Options**:
- `--features.fileUpload=true` - Enable file upload
- `--storageProvider=local|s3|gcs|azure` - Choose storage provider
- `--imagePprocessing=true` - Enable image processing (requires Sharp)

### 2. Install Required Dependencies

**Base Dependencies** (all providers):
```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

**AWS S3**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Google Cloud Storage**:
```bash
npm install @google-cloud/storage
```

**Azure Blob Storage**:
```bash
npm install @azure/storage-blob
```

**Image Processing** (optional):
```bash
npm install sharp
```

### 3. Configure Metadata

In your database metadata, mark columns as file upload:

```sql
-- PostgreSQL
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_file_upload,
  file_upload_config
) VALUES (
  '<table_id>',
  'profile_picture',
  'varchar',
  true,
  '{
    "maxSize": 5242880,
    "mimeTypes": ["image/jpeg", "image/png", "image/gif"],
    "storage": "s3",
    "bucket": "user-avatars",
    "path": "uploads/avatars",
    "resize": {
      "width": 500,
      "height": 500,
      "fit": "cover"
    }
  }'::jsonb
);

-- Multiple file upload (array)
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_file_upload,
  file_upload_config
) VALUES (
  '<table_id>',
  'attachments',
  'varchar[]',
  true,
  '{
    "maxSize": 10485760,
    "maxCount": 5,
    "mimeTypes": ["application/pdf", "image/*"],
    "storage": "s3",
    "bucket": "user-documents"
  }'::jsonb
);
```

## Quick Start

### 1. Local Storage (Development)

**.env**:
```env
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880
```

**Generated Controller**:
```typescript
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('users/profile')
export class UsersProfileController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('profile_picture', {
    limits: { fileSize: 5242880 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  }))
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.upload(file, 'avatars');
    return { url };
  }

  @Delete('delete/:filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.storageService.delete(filename, 'avatars');
    return { message: 'File deleted successfully' };
  }
}
```

**Usage**:
```bash
curl -X POST http://localhost:3000/users/profile/upload \
  -F "profile_picture=@/path/to/image.jpg"
```

### 2. AWS S3 (Production)

**.env**:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=my-app-uploads
S3_USE_ACCELERATE=false
S3_CUSTOM_ENDPOINT=  # Optional: for S3-compatible services
```

**Generated StorageService**:
```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket = process.env.AWS_S3_BUCKET;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload(file: Express.Multer.File, path: string): Promise<string> {
    const key = `${path}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // or 'private' for signed URLs
    });

    await this.s3Client.send(command);
    
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async delete(filename: string, path: string): Promise<void> {
    const key = `${path}/${filename}`;
    
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

**CloudFront Integration**:
```env
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=APKA...
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem
```

### 3. Google Cloud Storage

**.env**:
```env
GCP_PROJECT_ID=my-project-id
GCP_KEY_FILE=./service-account.json
GCS_BUCKET=my-app-uploads
GCS_CDN_DOMAIN=  # Optional: Cloud CDN domain
```

**Service Account Setup**:
1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Create service account with "Storage Object Admin" role
3. Download JSON key file
4. Set `GCP_KEY_FILE` to the key file path

**Generated StorageService**:
```typescript
import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucket: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
    this.bucket = process.env.GCS_BUCKET;
  }

  async upload(file: Express.Multer.File, path: string): Promise<string> {
    const blob = this.storage.bucket(this.bucket).file(`${path}/${Date.now()}-${file.originalname}`);
    
    await blob.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      public: true, // or false for signed URLs
    });

    return `https://storage.googleapis.com/${this.bucket}/${blob.name}`;
  }

  async delete(filename: string, path: string): Promise<void> {
    await this.storage.bucket(this.bucket).file(`${path}/${filename}`).delete();
  }

  async getSignedUrl(filename: string, expiresIn = 3600): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucket)
      .file(filename)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

    return url;
  }
}
```

### 4. Azure Blob Storage

**.env**:
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=uploads
AZURE_CDN_ENDPOINT=  # Optional: Azure CDN endpoint
```

**Connection String**:
1. Go to Azure Portal → Storage Accounts
2. Select your storage account
3. Settings → Access keys
4. Copy "Connection string"

**Generated StorageService**:
```typescript
import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class StorageService {
  private containerClient: ContainerClient;

  constructor() {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
    );
    this.containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER,
    );
  }

  async upload(file: Express.Multer.File, path: string): Promise<string> {
    const blobName = `${path}/${Date.now()}-${file.originalname}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    return blockBlobClient.url;
  }

  async delete(filename: string, path: string): Promise<void> {
    const blobName = `${path}/${filename}`;
    await this.containerClient.deleteBlob(blobName);
  }

  async getSignedUrl(blobName: string, expiresIn = 3600): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions: 'r', // read
      expiresOn: new Date(Date.now() + expiresIn * 1000),
    });

    return sasUrl;
  }
}
```

## Storage Providers

### Comparison Matrix

| Feature | Local | AWS S3 | Google Cloud Storage | Azure Blob |
|---------|-------|--------|---------------------|------------|
| **Cost** | Free | Pay per GB | Pay per GB | Pay per GB |
| **Scalability** | Limited | Unlimited | Unlimited | Unlimited |
| **CDN** | ❌ | CloudFront | Cloud CDN | Azure CDN |
| **Signed URLs** | ❌ | ✅ | ✅ | ✅ |
| **Versioning** | ❌ | ✅ | ✅ | ✅ |
| **Lifecycle** | ❌ | ✅ | ✅ | ✅ |
| **Geo-replication** | ❌ | ✅ | ✅ | ✅ |
| **Best For** | Development | Production (AWS) | Production (GCP) | Production (Azure) |

### Provider-Specific Features

#### AWS S3
- **Transfer Acceleration**: Faster uploads over long distances
- **Intelligent Tiering**: Automatic cost optimization
- **Glacier**: Long-term archival
- **Object Lock**: Compliance (WORM)
- **Event Notifications**: Trigger Lambda on upload

#### Google Cloud Storage
- **Nearline/Coldline**: Cost-effective archival
- **Pub/Sub Notifications**: Event-driven processing
- **Cloud CDN**: Global edge caching
- **Object Lifecycle**: Automatic deletion/archival
- **Uniform Bucket-Level Access**: Simplified IAM

#### Azure Blob Storage
- **Hot/Cool/Archive Tiers**: Cost optimization
- **Blob Versioning**: Keep file history
- **Soft Delete**: Recycle bin for blobs
- **Azure CDN**: Global distribution
- **Event Grid**: Event-driven architecture

## Usage Examples

### Single File Upload

**Frontend (React/Next.js)**:
```tsx
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('profile_picture', file);

  const response = await fetch('/api/users/profile/upload', {
    method: 'POST',
    body: formData,
  });

  const { url } = await response.json();
  console.log('Uploaded:', url);
}
```

**Backend (Generated)**:
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('profile_picture'))
async uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
  const url = await this.storageService.upload(file, 'avatars');
  
  // Update database
  await this.service.update(userId, { profile_picture: url });
  
  return { url };
}
```

### Multiple File Upload

**Frontend**:
```tsx
async function uploadMultiple(files: FileList) {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('attachments', file);
  });

  const response = await fetch('/api/users/profile/upload-multiple', {
    method: 'POST',
    body: formData,
  });

  const { urls } = await response.json();
  console.log('Uploaded:', urls);
}
```

**Backend (Generated)**:
```typescript
@Post('upload-multiple')
@UseInterceptors(FilesInterceptor('attachments', 5)) // max 5 files
async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
  const urls = await Promise.all(
    files.map(file => this.storageService.upload(file, 'documents'))
  );
  
  // Update database
  await this.service.update(userId, { attachments: urls });
  
  return { urls };
}
```

### Image Upload with Resize

**With Sharp Integration**:
```typescript
import * as sharp from 'sharp';

@Post('upload')
@UseInterceptors(FileInterceptor('image'))
async uploadImage(@UploadedFile() file: Express.Multer.File) {
  // Resize image
  const resized = await sharp(file.buffer)
    .resize(500, 500, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Create new file object
  const processedFile = {
    ...file,
    buffer: resized,
    originalname: file.originalname.replace(/\.\w+$/, '.jpg'),
    mimetype: 'image/jpeg',
  };

  const url = await this.storageService.upload(processedFile, 'avatars');
  return { url };
}
```

### Generate Thumbnails

**Multiple Sizes**:
```typescript
async uploadWithThumbnails(@UploadedFile() file: Express.Multer.File) {
  const sizes = [
    { name: 'original', width: null, height: null },
    { name: 'large', width: 1024, height: 1024 },
    { name: 'medium', width: 512, height: 512 },
    { name: 'thumb', width: 150, height: 150 },
  ];

  const urls = {};

  for (const size of sizes) {
    let buffer = file.buffer;

    if (size.width) {
      buffer = await sharp(file.buffer)
        .resize(size.width, size.height, { fit: 'inside' })
        .toBuffer();
    }

    const processedFile = { ...file, buffer };
    urls[size.name] = await this.storageService.upload(
      processedFile,
      `images/${size.name}`
    );
  }

  return { urls };
}
```

### Direct Upload to S3 (Presigned URL)

**Generate Presigned URL**:
```typescript
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Post('presigned-url')
async getPresignedUrl(@Body() dto: { filename: string; contentType: string }) {
  const key = `uploads/${Date.now()}-${dto.filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: dto.contentType,
  });

  const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

  return { url, key };
}
```

**Frontend (Direct Upload)**:
```tsx
async function directUpload(file: File) {
  // 1. Get presigned URL
  const { url, key } = await fetch('/api/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
    }),
  }).then(r => r.json());

  // 2. Upload directly to S3
  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  // 3. Save URL to database
  await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_picture: key }),
  });
}
```

## API Reference

### StorageService

#### `upload(file, path, options?)`
Upload a file to storage.

**Parameters**:
- `file`: Express.Multer.File - The file to upload
- `path`: string - Path/folder in storage
- `options?`: UploadOptions - Additional options

**Returns**: Promise<string> - Public URL of uploaded file

**Example**:
```typescript
const url = await storageService.upload(file, 'avatars', {
  acl: 'public-read',
  metadata: { userId: '123' }
});
```

#### `delete(filename, path?)`
Delete a file from storage.

**Parameters**:
- `filename`: string - File name or key
- `path?`: string - Optional path/folder

**Returns**: Promise<void>

**Example**:
```typescript
await storageService.delete('avatar.jpg', 'avatars');
```

#### `getSignedUrl(key, expiresIn?)`
Generate signed URL for private files.

**Parameters**:
- `key`: string - File key/path
- `expiresIn?`: number - Expiration in seconds (default: 3600)

**Returns**: Promise<string> - Signed URL

**Example**:
```typescript
const url = await storageService.getSignedUrl('private/doc.pdf', 7200);
```

#### `exists(key)`
Check if file exists.

**Parameters**:
- `key`: string - File key/path

**Returns**: Promise<boolean>

**Example**:
```typescript
const exists = await storageService.exists('avatars/user123.jpg');
```

#### `getMetadata(key)`
Get file metadata.

**Parameters**:
- `key`: string - File key/path

**Returns**: Promise<FileMetadata>

**Example**:
```typescript
const metadata = await storageService.getMetadata('avatars/user123.jpg');
// { size: 1024000, contentType: 'image/jpeg', lastModified: Date }
```

### File Upload Configuration

```typescript
interface FileUploadConfig {
  maxSize: number;           // Max file size in bytes
  maxCount?: number;         // Max files for multiple upload
  mimeTypes: string[];       // Allowed MIME types
  storage: 'local' | 's3' | 'gcs' | 'azure';
  bucket?: string;           // Cloud storage bucket/container
  path?: string;             // Default path prefix
  resize?: ImageResizeConfig;
  thumbnail?: boolean;
  virusScan?: boolean;
}

interface ImageResizeConfig {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}
```

## Security & Validation

### MIME Type Validation

**Strict Validation**:
```typescript
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files are allowed'), false);
  }
};

@Post('upload')
@UseInterceptors(FileInterceptor('file', { fileFilter: imageFilter }))
async upload(@UploadedFile() file) { /* ... */ }
```

**Wildcard Matching**:
```typescript
const documentFilter = (req, file, cb) => {
  const allowed = ['image/*', 'application/pdf', 'application/msword'];
  
  const isAllowed = allowed.some(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return file.mimetype.startsWith(prefix);
    }
    return file.mimetype === pattern;
  });
  
  cb(null, isAllowed);
};
```

### File Extension Validation

**Double Extension Check**:
```typescript
import * as path from 'path';

const extensionFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException(`File type ${ext} not allowed`), false);
  }
};
```

### Virus Scanning

**ClamAV Integration**:
```bash
npm install clamscan
```

```typescript
import NodeClam from 'clamscan';

@Injectable()
export class VirusScanService {
  private clam: NodeClam;

  async onModuleInit() {
    this.clam = await new NodeClam().init({
      clamdscan: {
        host: 'localhost',
        port: 3310,
      },
    });
  }

  async scanFile(file: Express.Multer.File): Promise<boolean> {
    const { isInfected } = await this.clam.scanBuffer(file.buffer);
    
    if (isInfected) {
      throw new BadRequestException('File contains malware');
    }
    
    return true;
  }
}

// Usage
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file: Express.Multer.File) {
  await this.virusScanService.scanFile(file);
  const url = await this.storageService.upload(file, 'uploads');
  return { url };
}
```

### Secure File Names

**Sanitize Filenames**:
```typescript
import * as sanitize from 'sanitize-filename';
import { v4 as uuidv4 } from 'uuid';

function generateSecureFilename(originalname: string): string {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext);
  const safe = sanitize(base).replace(/\s+/g, '-').toLowerCase();
  const unique = `${Date.now()}-${uuidv4().slice(0, 8)}`;
  
  return `${safe}-${unique}${ext}`;
}

// Usage
const secureFilename = generateSecureFilename(file.originalname);
const url = await this.storageService.upload(file, `uploads/${secureFilename}`);
```

### Rate Limiting

**Throttle Upload Endpoints**:
```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('upload')
export class UploadController {
  @Post()
  @Throttle(10, 60) // 10 uploads per 60 seconds
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file) {
    // ...
  }
}
```

## Image Processing

### Resize & Optimize

**Basic Resize**:
```typescript
import * as sharp from 'sharp';

async processImage(file: Express.Multer.File, width: number, height: number) {
  const processed = await sharp(file.buffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80, progressive: true })
    .toBuffer();

  return { ...file, buffer: processed };
}
```

**Preserve Aspect Ratio**:
```typescript
async resizePreserveAspect(file: Express.Multer.File, maxWidth: number) {
  const processed = await sharp(file.buffer)
    .resize(maxWidth, null, { fit: 'inside' })
    .toBuffer();

  return { ...file, buffer: processed };
}
```

### Watermark

**Text Watermark**:
```typescript
async addWatermark(file: Express.Multer.File, text: string) {
  const svg = `
    <svg width="200" height="30">
      <text x="10" y="20" font-size="20" fill="white" fill-opacity="0.5">
        ${text}
      </text>
    </svg>
  `;

  const watermark = Buffer.from(svg);

  const processed = await sharp(file.buffer)
    .composite([{
      input: watermark,
      gravity: 'southeast',
    }])
    .toBuffer();

  return { ...file, buffer: processed };
}
```

**Image Watermark**:
```typescript
async addLogoWatermark(file: Express.Multer.File, logoPath: string) {
  const processed = await sharp(file.buffer)
    .composite([{
      input: logoPath,
      gravity: 'southeast',
      blend: 'over',
    }])
    .toBuffer();

  return { ...file, buffer: processed };
}
```

### Format Conversion

**Convert to WebP**:
```typescript
async convertToWebP(file: Express.Multer.File) {
  const processed = await sharp(file.buffer)
    .webp({ quality: 80 })
    .toBuffer();

  return {
    ...file,
    buffer: processed,
    originalname: file.originalname.replace(/\.\w+$/, '.webp'),
    mimetype: 'image/webp',
  };
}
```

### EXIF Data Removal

**Strip Metadata**:
```typescript
async stripExif(file: Express.Multer.File) {
  const processed = await sharp(file.buffer)
    .rotate() // Auto-rotate based on EXIF
    .withMetadata({ orientation: 1 }) // Reset orientation
    .toBuffer();

  return { ...file, buffer: processed };
}
```

## Advanced Features

### Progress Tracking

**Server-Sent Events (SSE)**:
```typescript
import { Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Sse('upload-progress/:uploadId')
uploadProgress(@Param('uploadId') uploadId: string): Observable<MessageEvent> {
  return interval(1000).pipe(
    map(() => ({
      data: {
        uploadId,
        progress: this.uploadTracker.getProgress(uploadId),
      },
    })),
  );
}
```

### Chunked Upload

**Large File Upload**:
```typescript
@Post('upload-chunk')
async uploadChunk(
  @Body() dto: { filename: string; chunk: number; totalChunks: number },
  @UploadedFile() file: Express.Multer.File,
) {
  const chunkPath = `./temp/${dto.filename}-${dto.chunk}`;
  await fs.promises.writeFile(chunkPath, file.buffer);

  // Check if all chunks uploaded
  if (dto.chunk === dto.totalChunks - 1) {
    // Merge chunks
    const fullFile = await this.mergeChunks(dto.filename, dto.totalChunks);
    
    // Upload to cloud
    const url = await this.storageService.upload(fullFile, 'uploads');
    
    // Cleanup temp files
    await this.cleanupChunks(dto.filename, dto.totalChunks);
    
    return { url };
  }

  return { message: 'Chunk uploaded', chunk: dto.chunk };
}
```

### File Metadata in Database

**Track Uploads**:
```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100),
  entity_id UUID,
  field_name VARCHAR(100),
  original_filename VARCHAR(255),
  stored_filename VARCHAR(255),
  file_size BIGINT,
  mime_type VARCHAR(100),
  storage_provider VARCHAR(50),
  storage_key VARCHAR(500),
  url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  deleted_at TIMESTAMP
);
```

```typescript
@Injectable()
export class FileUploadService {
  async trackUpload(data: TrackUploadDto): Promise<FileUpload> {
    return this.repository.create({
      entity_type: data.entityType,
      entity_id: data.entityId,
      field_name: data.fieldName,
      original_filename: data.originalFilename,
      stored_filename: data.storedFilename,
      file_size: data.fileSize,
      mime_type: data.mimeType,
      storage_provider: process.env.STORAGE_PROVIDER,
      storage_key: data.storageKey,
      url: data.url,
      created_by: data.userId,
    });
  }

  async cleanup(entityType: string, entityId: string): Promise<number> {
    const files = await this.repository.find({
      where: { entity_type: entityType, entity_id: entityId },
    });

    for (const file of files) {
      await this.storageService.delete(file.storage_key);
    }

    return files.length;
  }
}
```

### CDN Integration

**CloudFront (AWS)**:
```typescript
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

@Injectable()
export class CdnService {
  private cloudfront: CloudFrontClient;

  constructor() {
    this.cloudfront = new CloudFrontClient({ region: process.env.AWS_REGION });
  }

  async invalidateCache(paths: string[]): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
        CallerReference: Date.now().toString(),
      },
    });

    await this.cloudfront.send(command);
  }

  getCdnUrl(key: string): string {
    return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  }
}
```

## Best Practices

### 1. Always Validate Files

```typescript
// ✅ Good: Multiple validation layers
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('Only images allowed'), false);
    }
    
    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new BadRequestException('Invalid file extension'), false);
    }
    
    cb(null, true);
  },
}))
async upload(@UploadedFile() file: Express.Multer.File) {
  // Additional validation
  if (!file) {
    throw new BadRequestException('File is required');
  }
  
  // Virus scan
  await this.virusScanService.scan(file);
  
  // Process and upload
  const url = await this.storageService.upload(file, 'uploads');
  return { url };
}
```

### 2. Use Signed URLs for Private Files

```typescript
// ❌ Bad: Public URL for sensitive documents
const url = await storageService.upload(file, 'contracts', { acl: 'public-read' });

// ✅ Good: Private upload with signed URL generation
const url = await storageService.upload(file, 'contracts', { acl: 'private' });
const signedUrl = await storageService.getSignedUrl(key, 3600); // 1 hour expiry
```

### 3. Optimize Images

```typescript
// ❌ Bad: Upload original large images
await storageService.upload(file, 'images');

// ✅ Good: Resize and optimize before upload
const optimized = await sharp(file.buffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80, progressive: true })
  .toBuffer();

const processedFile = { ...file, buffer: optimized };
await storageService.upload(processedFile, 'images');
```

### 4. Generate Unique Filenames

```typescript
// ❌ Bad: Use original filename (security risk)
const key = `uploads/${file.originalname}`;

// ✅ Good: Generate unique, sanitized filename
import { v4 as uuidv4 } from 'uuid';

const ext = path.extname(file.originalname);
const key = `uploads/${uuidv4()}${ext}`;
```

### 5. Cleanup on Delete

```typescript
// ✅ Good: Delete files when entity is deleted
async delete(id: string): Promise<void> {
  const entity = await this.repository.findOne(id);
  
  // Delete from storage
  if (entity.profile_picture) {
    await this.storageService.delete(entity.profile_picture);
  }
  
  if (entity.attachments?.length) {
    await Promise.all(
      entity.attachments.map(url => this.storageService.delete(url))
    );
  }
  
  // Delete from database
  await this.repository.delete(id);
}
```

### 6. Use Environment Variables

```typescript
// ❌ Bad: Hardcoded credentials
const s3 = new S3Client({
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
});

// ✅ Good: Use environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

### 7. Implement Error Handling

```typescript
@Post('upload')
async upload(@UploadedFile() file: Express.Multer.File) {
  try {
    // Validate
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload
    const url = await this.storageService.upload(file, 'uploads');

    // Save to database
    await this.service.update(userId, { avatar: url });

    return { url };
  } catch (error) {
    // Log error
    this.logger.error('Upload failed', error);

    // Cleanup if partial upload
    if (error.partialUpload) {
      await this.storageService.delete(error.key);
    }

    // Return user-friendly error
    throw new InternalServerErrorException('Failed to upload file');
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "File size limit exceeded"

**Error**:
```
PayloadTooLargeError: request entity too large
```

**Solution**:
```typescript
// Increase limit in main.ts
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

const app = await NestFactory.create(AppModule);
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

#### 2. "Multipart/form-data not parsed"

**Error**:
```
Request body is empty
```

**Solution**:
```bash
# Ensure multer is installed
npm install @nestjs/platform-express multer

# Use FileInterceptor
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file: Express.Multer.File) { }
```

#### 3. "S3 Access Denied"

**Error**:
```
AccessDenied: User is not authorized to perform: s3:PutObject
```

**Solution**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

#### 4. "CORS Error on Direct Upload"

**Error**:
```
Access to fetch has been blocked by CORS policy
```

**Solution (S3)**:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

#### 5. "Sharp Installation Failed"

**Error**:
```
Could not load the "sharp" module
```

**Solution**:
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# If still fails, install specific platform binary
npm install --platform=linux --arch=x64 sharp
```

### Performance Tips

1. **Use Streaming for Large Files**:
```typescript
import { createReadStream, createWriteStream } from 'fs';

async uploadLargeFile(filePath: string, key: string) {
  const fileStream = createReadStream(filePath);
  
  const upload = new Upload({
    client: this.s3Client,
    params: {
      Bucket: this.bucket,
      Key: key,
      Body: fileStream,
    },
  });

  await upload.done();
}
```

2. **Enable Compression**:
```typescript
// main.ts
import * as compression from 'compression';

app.use(compression());
```

3. **Cache File Metadata**:
```typescript
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

async getFileInfo(key: string) {
  const cacheKey = `file:${key}`;
  
  // Check cache
  let info = await this.cacheManager.get(cacheKey);
  
  if (!info) {
    // Fetch from storage
    info = await this.storageService.getMetadata(key);
    
    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, info, 3600);
  }
  
  return info;
}
```

## Migration Guide

### From Multer Local to S3

**Before**:
```typescript
import { diskStorage } from 'multer';

@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
}))
```

**After**:
```typescript
import { StorageService } from './storage.service';

@UseInterceptors(FileInterceptor('file'))
async upload(
  @UploadedFile() file: Express.Multer.File,
  @Inject(StorageService) storage: StorageService,
) {
  const url = await storage.upload(file, 'uploads');
  return { url };
}
```

### Environment Variables Migration

```env
# Before (local)
UPLOAD_DEST=./uploads

# After (S3)
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=my-bucket
```

---

## Additional Resources

- [Multer Documentation](https://github.com/expressjs/multer)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.1  
**Maintained By**: @ojiepermana  
**License**: MIT

# File Upload Quick Start Guide

Get file upload with cloud storage running in **7 minutes**.

## Prerequisites

- Node.js 24+
- npm 11+
- NestJS 11+
- Database (PostgreSQL 18+ or MySQL 8+)
- Cloud account (AWS/GCP/Azure) or use local storage

## Step 1: Choose Storage Provider (30 sec)

**Option A: Local Storage** (fastest setup)

- No cloud account needed
- Files stored on server filesystem
- Good for: Development, small apps

**Option B: AWS S3** (recommended for production)

- Scalable, reliable, CDN integration
- Good for: Production apps, media hosting

**Option C: Google Cloud Storage**

- Similar to S3, Google ecosystem
- Good for: Apps using GCP

**Option D: Azure Blob Storage**

- Microsoft cloud storage
- Good for: Enterprise, Azure apps

## Step 2: Install Dependencies (1 min)

**All providers need:**

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

**AWS S3:**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Google Cloud Storage:**

```bash
npm install @google-cloud/storage
```

**Azure Blob:**

```bash
npm install @azure/storage-blob
```

**Image Processing** (optional):

```bash
npm install sharp
```

## Step 3: Configure Environment (1 min)

Create `.env` file:

**Local Storage:**

```env
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE=10485760  # 10MB
```

**AWS S3:**

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=my-app-uploads
```

**Google Cloud Storage:**

```env
GCP_PROJECT_ID=my-project
GCP_KEY_FILE=./service-account.json
GCS_BUCKET=my-app-uploads
```

**Azure Blob:**

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_CONTAINER=uploads
```

## Step 4: Setup Database Metadata (1 min)

Mark columns as file upload fields:

```sql
-- Single file upload (avatar, profile picture)
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_file_upload,
  file_upload_config
) VALUES (
  '<your_table_metadata_id>',
  'profile_picture',
  'varchar',
  true,
  '{
    "maxSize": 5242880,
    "mimeTypes": ["image/jpeg", "image/png", "image/gif"],
    "storage": "s3",
    "bucket": "user-avatars",
    "path": "uploads/avatars"
  }'::jsonb
);

-- Multiple file upload (attachments, documents)
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_file_upload,
  file_upload_config
) VALUES (
  '<your_table_metadata_id>',
  'attachments',
  'varchar[]',
  true,
  '{
    "maxSize": 10485760,
    "maxCount": 5,
    "mimeTypes": ["application/pdf", "image/*", "application/zip"],
    "storage": "s3",
    "bucket": "user-documents",
    "path": "uploads/documents"
  }'::jsonb
);
```

## Step 5: Generate Module with File Upload (1 min)

```bash
nest-generator generate users.profile \
  --features.fileUpload=true \
  --storageProvider=s3
```

This generates:

```
src/modules/users-profile/
├── storage/
│   ├── storage.service.ts           # Multi-provider storage
│   ├── storage.interface.ts         # Storage contracts
│   └── providers/
│       ├── local.storage.ts         # Local filesystem
│       ├── s3.storage.ts            # AWS S3
│       ├── gcs.storage.ts           # Google Cloud
│       └── azure.storage.ts         # Azure Blob
├── users-profile.controller.ts      # With upload endpoints
├── users-profile.service.ts         # File handling logic
└── users-profile.module.ts          # StorageService provider
```

## Step 6: Test File Upload (1 min)

**Single File Upload:**

```bash
# Upload profile picture
curl -X POST http://localhost:3000/users/profile/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profile_picture=@/path/to/image.jpg"

# Response:
{
  "url": "https://your-bucket.s3.amazonaws.com/uploads/avatars/filename.jpg",
  "filename": "01933e8a-7b2c-7890-a1b2-c3d4e5f6a7b8.jpg",
  "size": 245832,
  "mimeType": "image/jpeg"
}
```

**Multiple Files Upload:**

```bash
# Upload multiple attachments
curl -X POST http://localhost:3000/users/profile/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "attachments=@/path/to/doc1.pdf" \
  -F "attachments=@/path/to/doc2.pdf" \
  -F "attachments=@/path/to/image.jpg"

# Response:
{
  "files": [
    {
      "url": "https://..../doc1.pdf",
      "filename": "uuid1.pdf",
      "size": 123456
    },
    {
      "url": "https://..../doc2.pdf",
      "filename": "uuid2.pdf",
      "size": 234567
    },
    {
      "url": "https://..../image.jpg",
      "filename": "uuid3.jpg",
      "size": 345678
    }
  ]
}
```

## Step 7: Delete Files (30 sec)

```bash
# Delete uploaded file
curl -X DELETE http://localhost:3000/users/profile/delete/filename.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "message": "File deleted successfully",
  "filename": "filename.jpg"
}
```

## Generated Endpoints

The generator creates these endpoints automatically:

```typescript
@Controller('users/profile')
export class UsersProfileController {
  // Single file upload
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('profile_picture', {
      limits: { fileSize: 5242880 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
          return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.upload(file, 'avatars');
    return { url, filename: file.filename, size: file.size };
  }

  // Multiple files upload
  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      limits: { fileSize: 10485760 }, // 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
    const uploads = await Promise.all(files.map((file) => this.storageService.upload(file, 'documents')));
    return { files: uploads };
  }

  // Delete file
  @Delete('delete/:filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.storageService.delete(filename);
    return { message: 'File deleted successfully', filename };
  }
}
```

## Storage Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from './storage/storage.service';

@Injectable()
export class UsersProfileService {
  constructor(private readonly storageService: StorageService) {}

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Upload new avatar
    const url = await this.storageService.upload(file, 'avatars', {
      fileName: `${userId}-avatar`,
      metadata: { userId, uploadedAt: new Date().toISOString() },
    });

    // Delete old avatar (if exists)
    const user = await this.findOne(userId);
    if (user.avatar_url) {
      const oldFilename = this.extractFilename(user.avatar_url);
      await this.storageService.delete(oldFilename);
    }

    // Update user record
    return this.repository.update(userId, { avatar_url: url });
  }

  async getSignedUrl(filename: string, expiresIn = 3600) {
    // Generate temporary signed URL (S3, GCS, Azure)
    return this.storageService.getSignedUrl(filename, expiresIn);
  }

  async downloadFile(filename: string) {
    // Get file as buffer
    return this.storageService.download(filename);
  }

  async listUserFiles(userId: string, prefix: string) {
    // List all files for user
    return this.storageService.listFiles(prefix);
  }
}
```

## Advanced Features

### 1. Image Processing (Resize, Crop)

```typescript
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  async uploadWithResize(file: Express.Multer.File) {
    // Resize to 500x500, maintain aspect ratio
    const resized = await sharp(file.buffer).resize(500, 500, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer();

    // Upload resized image
    const modifiedFile = {
      ...file,
      buffer: resized,
      size: resized.length,
    };

    return this.storageService.upload(modifiedFile, 'avatars');
  }

  async createThumbnail(file: Express.Multer.File) {
    const thumbnail = await sharp(file.buffer).resize(150, 150, { fit: 'cover' }).jpeg({ quality: 60 }).toBuffer();

    return this.storageService.upload({ ...file, buffer: thumbnail }, 'thumbnails');
  }
}
```

### 2. Validation

```typescript
// Custom file validation
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    // Allowed extensions
    const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext)) {
      return cb(new BadRequestException('Invalid file extension'), false);
    }

    // Allowed MIME types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type'), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Additional validation
  if (file.size > 5242880) {
    throw new BadRequestException('File too large');
  }

  return this.storageService.upload(file, 'uploads');
}
```

### 3. Virus Scanning (ClamAV)

```typescript
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class VirusScanService {
  async scanFile(filePath: string): Promise<boolean> {
    try {
      await execAsync(`clamscan ${filePath}`);
      return true; // Clean
    } catch (error) {
      return false; // Infected
    }
  }

  async uploadWithScan(file: Express.Multer.File) {
    // Save to temp location
    const tempPath = `/tmp/${file.filename}`;
    await fs.writeFile(tempPath, file.buffer);

    // Scan
    const isClean = await this.scanFile(tempPath);

    if (!isClean) {
      await fs.unlink(tempPath);
      throw new BadRequestException('File contains malware');
    }

    // Upload if clean
    const url = await this.storageService.upload(file, 'uploads');
    await fs.unlink(tempPath);

    return url;
  }
}
```

### 4. Direct Browser Upload (Presigned URLs)

```typescript
// Generate presigned URL for client-side upload
@Get('upload-url')
async getUploadUrl(@Query('filename') filename: string) {
  const url = await this.storageService.getPresignedUploadUrl(filename, {
    expiresIn: 300, // 5 minutes
    contentType: 'image/jpeg',
    maxSize: 5242880,
  });

  return { uploadUrl: url, expiresIn: 300 };
}

// Client-side usage:
// fetch(uploadUrl, {
//   method: 'PUT',
//   body: file,
//   headers: { 'Content-Type': 'image/jpeg' }
// });
```

## Troubleshooting

### ❌ Error: "File too large"

**Solution**: Increase limit in Multer options:

```typescript
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}))
```

And in `.env`:

```env
UPLOAD_MAX_SIZE=10485760
```

### ❌ Error: "Invalid credentials" (AWS S3)

**Check:**

```bash
# Verify credentials
aws s3 ls s3://your-bucket --profile default

# Verify environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

**Solution**: Update `.env` with correct credentials.

### ❌ Files not uploading

**Check:**

1. Storage service is injected: `constructor(private storageService: StorageService)`
2. Provider is configured: Check `storage.service.ts` initialization
3. Bucket/container exists: Create manually if needed
4. Permissions: IAM user has write access (S3), Storage Admin role (GCS)

### ❌ CORS errors in browser

**AWS S3 CORS Configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Next Steps

- **Full Documentation**: [FILE_UPLOAD.md](../FILE_UPLOAD.md)
- **Image Processing**: Resize, crop, watermark with Sharp
- **CDN Integration**: CloudFront, Cloud CDN, Azure CDN
- **Virus Scanning**: ClamAV integration
- **Progress Tracking**: Upload progress events
- **File Versioning**: S3 versioning, backup strategies

## Quick Reference

```typescript
// Upload
await storageService.upload(file, path, options?)

// Download
await storageService.download(filename)

// Delete
await storageService.delete(filename)

// List files
await storageService.listFiles(prefix?)

// Get signed URL
await storageService.getSignedUrl(filename, expiresIn)

// Get presigned upload URL
await storageService.getPresignedUploadUrl(filename, options)
```

**Storage Providers:**

- `local` - Filesystem storage
- `s3` - AWS S3
- `gcs` - Google Cloud Storage
- `azure` - Azure Blob Storage

**Total Time: ~7 minutes** ✅

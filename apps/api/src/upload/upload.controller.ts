import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { UploadService, type FileUpload } from './upload.service';
import { UploadType } from './types/upload.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth-tokens.dto';

// Multer configuration for file upload
const multerConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
};

@ApiTags('upload')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({
    summary: 'Upload user avatar',
    description:
      'Upload a profile avatar image. Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File & { buffer: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileUpload: FileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const result = await this.uploadService.uploadAvatar(fileUpload);

    return {
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    };
  }

  @Post('attachment')
  @ApiOperation({
    summary: 'Upload attachment file',
    description:
      'Upload an attachment file (images, PDFs, documents). Max size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Attachment file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAttachment(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File & { buffer: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileUpload: FileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const result = await this.uploadService.uploadAttachment(fileUpload);

    return {
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.bytes,
      },
    };
  }

  @Post('audio')
  @ApiOperation({
    summary: 'Upload audio file',
    description: 'Upload an audio file (MP3, WAV, OGG, M4A). Max size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAudio(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File & { buffer: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileUpload: FileUpload = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };

    const result = await this.uploadService.uploadAudio(fileUpload);

    return {
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.bytes,
      },
    };
  }

  @Post('from-url')
  @ApiOperation({
    summary: 'Upload from URL',
    description: 'Upload a file from a remote URL.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['url', 'type'],
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'Remote URL of the file',
          example: 'https://example.com/image.jpg',
        },
        type: {
          type: 'string',
          enum: ['avatar', 'attachment', 'audio'],
          description: 'Type of upload',
          example: 'avatar',
        },
      },
    },
  })
  async uploadFromUrl(
    @CurrentUser() user: JwtPayload,
    @Body() body: { url: string; type: UploadType },
  ) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    const uploadType = body.type || UploadType.ATTACHMENT;

    const result = await this.uploadService.uploadFromUrl(body.url, uploadType);

    return {
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    };
  }
}

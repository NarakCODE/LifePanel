import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';
import {
  UploadResult,
  UploadType,
  UPLOAD_TYPE_CONFIG,
} from './types/upload.types';

export interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: Record<UploadType, string[]>;

  constructor(
    private readonly cloudinary: CloudinaryProvider,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>(
      'upload.maxFileSize',
      5 * 1024 * 1024,
    ); // 5MB default

    this.allowedMimeTypes = {
      [UploadType.AVATAR]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ],
      [UploadType.ATTACHMENT]: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      [UploadType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    };
  }

  /**
   * Upload an avatar image
   */
  async uploadAvatar(file: FileUpload): Promise<UploadResult> {
    this.validateFile(file, UploadType.AVATAR);

    try {
      const result = await this.cloudinary.uploadFile(file.buffer, {
        folder: UPLOAD_TYPE_CONFIG[UploadType.AVATAR].folder,
        transformation: UPLOAD_TYPE_CONFIG[UploadType.AVATAR].transformation,
      });

      this.logger.log(`Avatar uploaded: ${result.publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Avatar upload failed: ${(error as Error).message}`);
      throw new BadRequestException(
        `Avatar upload failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Upload an attachment file
   */
  async uploadAttachment(file: FileUpload): Promise<UploadResult> {
    this.validateFile(file, UploadType.ATTACHMENT);

    try {
      const result = await this.cloudinary.uploadFile(file.buffer, {
        folder: UPLOAD_TYPE_CONFIG[UploadType.ATTACHMENT].folder,
      });

      this.logger.log(`Attachment uploaded: ${result.publicId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Attachment upload failed: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        `Attachment upload failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Upload an audio file
   */
  async uploadAudio(file: FileUpload): Promise<UploadResult> {
    this.validateFile(file, UploadType.AUDIO);

    try {
      const result = await this.cloudinary.uploadFile(file.buffer, {
        folder: UPLOAD_TYPE_CONFIG[UploadType.AUDIO].folder,
      });

      this.logger.log(`Audio uploaded: ${result.publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Audio upload failed: ${(error as Error).message}`);
      throw new BadRequestException(
        `Audio upload failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Delete a file by public ID
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await this.cloudinary.deleteFile(publicId);
      this.logger.log(`File deleted: ${publicId}`);
    } catch (error) {
      this.logger.error(`File deletion failed: ${(error as Error).message}`);
      throw new BadRequestException(
        `File deletion failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Upload from a URL
   */
  async uploadFromUrl(
    url: string,
    type: UploadType = UploadType.ATTACHMENT,
  ): Promise<UploadResult> {
    try {
      const result = await this.cloudinary.uploadFromUrl(url, {
        folder: UPLOAD_TYPE_CONFIG[type].folder,
        transformation: UPLOAD_TYPE_CONFIG[type].transformation,
      });

      this.logger.log(`File uploaded from URL: ${result.publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`URL upload failed: ${(error as Error).message}`);
      throw new BadRequestException(
        `URL upload failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: FileUpload, type: UploadType): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check file type
    const allowedTypes = this.allowedMimeTypes[type];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`,
      );
    }

    // Check for empty file
    if (file.size === 0 || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File is empty');
    }

    this.logger.debug(
      `File validation passed: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );
  }
}

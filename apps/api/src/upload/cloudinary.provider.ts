import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import type {
  CloudinaryConfig,
  UploadOptions,
  UploadResult,
  TransformationOptions,
} from './types/upload.types';

@Injectable()
export class CloudinaryProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly config: CloudinaryConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      cloudName: this.configService.get<string>('cloudinary.cloudName') || '',
      apiKey: this.configService.get<string>('cloudinary.apiKey') || '',
      apiSecret: this.configService.get<string>('cloudinary.apiSecret') || '',
      uploadPreset: this.configService.get<string>('cloudinary.uploadPreset'),
      folder: this.configService.get<string>(
        'cloudinary.folder',
        'life-dashboard',
      ),
    };

    this.validateConfig();
    this.initialize();
  }

  private validateConfig(): void {
    const { cloudName, apiKey, apiSecret } = this.config;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary configuration is incomplete. ' +
          'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      );
    }
  }

  private initialize(): void {
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
    });

    this.logger.log('Cloudinary initialized successfully');
  }

  /**
   * Upload a file buffer to Cloudinary
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const { folder = this.config.folder, publicId, transformation } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.config.folder}/${folder}`,
          public_id: publicId,
          transformation: transformation
            ? this.buildTransformation(transformation)
            : undefined,
          resource_type: 'auto',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              `Cloudinary upload failed: ${error.message}`,
              error.stack,
            );
            reject(new Error(`Upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error('Upload failed: No result returned'));
            return;
          }

          this.logger.log(`File uploaded successfully: ${result.public_id}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );

      // Convert buffer to stream and pipe to upload stream
      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Upload a file from a URL (remote URL)
   */
  async uploadFromUrl(
    url: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const { folder = this.config.folder, publicId, transformation } = options;

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: `${this.config.folder}/${folder}`,
        public_id: publicId,
        transformation: transformation
          ? this.buildTransformation(transformation)
          : undefined,
        resource_type: 'auto',
      });

      this.logger.log(
        `File uploaded from URL successfully: ${result.public_id}`,
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error(
        `Cloudinary URL upload failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Upload from URL failed: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a file from Cloudinary by public ID
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== 'ok') {
        this.logger.warn(
          `Failed to delete file: ${publicId}, result: ${result.result}`,
        );
        throw new Error(`Failed to delete file: ${result.result}`);
      }

      this.logger.log(`File deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error(
        `Cloudinary delete failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Delete failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a signed URL for private resources
   */
  generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      transformation: [
        {
          expiration: Math.floor(Date.now() / 1000) + expiresInSeconds,
        },
      ],
    });
  }

  /**
   * Get the URL for a public resource
   */
  getUrl(publicId: string, transformation?: TransformationOptions): string {
    return cloudinary.url(publicId, {
      transformation: transformation
        ? this.buildTransformation(transformation)
        : undefined,
    });
  }

  /**
   * Build transformation array for Cloudinary
   */
  private buildTransformation(
    transformation: TransformationOptions,
  ): Array<Record<string, string | number>> {
    const transforms: Array<Record<string, string | number>> = [];

    if (transformation.width) {
      transforms.push({ width: transformation.width });
    }

    if (transformation.height) {
      transforms.push({ height: transformation.height });
    }

    if (transformation.crop) {
      transforms.push({ crop: transformation.crop });
    }

    if (transformation.quality) {
      transforms.push({ quality: transformation.quality });
    }

    if (transformation.format) {
      transforms.push({ fetch_format: transformation.format });
    }

    return transforms;
  }
}

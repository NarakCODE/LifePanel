export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
  folder: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: TransformationOptions;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}

export enum UploadType {
  AVATAR = 'avatar',
  ATTACHMENT = 'attachment',
  AUDIO = 'audio',
}

export const UPLOAD_TYPE_CONFIG: Record<UploadType, UploadOptions> = {
  [UploadType.AVATAR]: {
    folder: 'avatars',
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    },
  },
  [UploadType.ATTACHMENT]: {
    folder: 'attachments',
  },
  [UploadType.AUDIO]: {
    folder: 'audio',
  },
};

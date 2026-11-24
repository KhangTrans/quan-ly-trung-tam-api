import cloudinary from '../config/cloudinary';
import { ENV } from '../config/env';

export class UploadService {
  /**
   * Upload an image (Data URI Base64 or URL) to Cloudinary
   * @param fileData Data URI (e.g. data:image/png;base64,...) or remote URL
   * @param userId User identifier to name the public ID
   * @returns The secure URL of the uploaded image
   */
  static async uploadAvatar(fileData: string, userId: string): Promise<string> {
    const isConfigured =
      (Boolean(ENV.CLOUDINARY_API_KEY) && Boolean(ENV.CLOUDINARY_API_SECRET)) ||
      Boolean(ENV.CLOUDINARY_URL && !ENV.CLOUDINARY_URL.includes('<your_api_key>'));

    if (!isConfigured) {
      console.warn('Cloudinary chưa được cấu hình đầy đủ API Key và API Secret. Giữ nguyên data fallback.');
      return fileData;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(fileData, {
        folder: 'minhtucenter/avatars',
        public_id: `avatar_${userId}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return uploadResult.secure_url;
    } catch (error) {
      console.error('Lỗi khi tải ảnh lên Cloudinary:', error);
      throw error;
    }
  }
}

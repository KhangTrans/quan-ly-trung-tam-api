import crypto from 'crypto';
import { ENV } from '../config/env';

export class OtpUtil {
  /**
   * Tạo ngẫu nhiên mã OTP 6 chữ số
   */
  static generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Tạo chuỗi token ký số HMAC (Stateless - không lưu DB)
   * Token gồm: [thời điểm hết hạn].[mã băm HMAC-SHA256]
   */
  static createOtpToken(
    email: string,
    otp: string,
    expiresInMinutes: number = ENV.OTP_EXPIRES_IN_MINUTES
  ): { otpToken: string; expiresAt: number } {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const dataToSign = `${normalizedEmail}|${cleanOtp}|${expiresAt}`;
    const hash = crypto
      .createHmac('sha256', ENV.OTP_SECRET)
      .update(dataToSign)
      .digest('hex');

    const otpToken = `${expiresAt}.${hash}`;
    return { otpToken, expiresAt };
  }

  /**
   * Xác thực mã OTP cùng otpToken từ client
   */
  static verifyOtpToken(
    email: string,
    otp: string,
    otpToken: string
  ): { valid: boolean; reason?: 'EXPIRED' | 'INVALID' } {
    if (!otpToken || typeof otpToken !== 'string' || !otpToken.includes('.')) {
      return { valid: false, reason: 'INVALID' };
    }

    const [expiresAtStr, providedHash] = otpToken.split('.');
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || !providedHash) {
      return { valid: false, reason: 'INVALID' };
    }

    // 1. Kiểm tra thời hạn hiệu lực (TTL)
    if (Date.now() > expiresAt) {
      return { valid: false, reason: 'EXPIRED' };
    }

    // 2. Tính toán hash kỳ vọng với secret key
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();
    const dataToSign = `${normalizedEmail}|${cleanOtp}|${expiresAt}`;
    const expectedHash = crypto
      .createHmac('sha256', ENV.OTP_SECRET)
      .update(dataToSign)
      .digest('hex');

    // 3. So sánh an toàn chống timing attacks
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: 'INVALID' };
    }

    const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    if (!isValid) {
      return { valid: false, reason: 'INVALID' };
    }

    return { valid: true };
  }
}

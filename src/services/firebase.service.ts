import { Auth, UserRecord, DecodedIdToken } from 'firebase-admin/auth';
import { getFirebaseAuth, isFirebaseReady } from '../config/firebase';
import { ENV } from '../config/env';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

export interface CreateFirebaseUserInput {
  email: string;
  password?: string;
  displayName?: string;
}

export interface SendVerificationResult {
  sentViaFirebase: boolean;
  link?: string;
}

export class FirebaseService {
  /**
   * Kiểm tra xem Firebase Admin đã sẵn sàng hoạt động hay chưa
   */
  static isConfigured(): boolean {
    return isFirebaseReady();
  }

  /**
   * Đảm bảo Firebase đã được khởi tạo trước khi gọi tác vụ
   */
  private static ensureConfigured(): Auth {
    if (!this.isConfigured()) {
      throw new AppError(
        'Hệ thống Firebase chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập.',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }
    return getFirebaseAuth();
  }

  /**
   * Tạo tài khoản người dùng trên Firebase Auth
   */
  static async createUser(input: CreateFirebaseUserInput): Promise<UserRecord> {
    const auth = this.ensureConfigured();

    try {
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        emailVerified: false,
      });
      return userRecord;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        // Nếu đã tồn tại trên Firebase, lấy thông tin tài khoản hiện có
        return await auth.getUserByEmail(input.email);
      }
      throw new AppError(
        `Lỗi tạo tài khoản Firebase: ${error.message || error.code}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  /**
   * Gửi email xác thực hoặc tạo liên kết xác thực Firebase
   * - Nếu có FIREBASE_WEB_API_KEY: Gọi REST API gửi email trực tiếp từ Firebase
   * - Nếu không: Tạo link xác thực qua Firebase Admin SDK (dùng cho dev hoặc gửi tùy biến)
   */
  static async sendVerificationEmail(
    email: string,
    continueUrl: string = ENV.CLIENT_URL
  ): Promise<SendVerificationResult> {
    const auth = this.ensureConfigured();

    const user = await auth.getUserByEmail(email);

    // 1. Thử gửi email tự động thông qua Firebase Auth REST API nếu có cấu hình Web API Key
    if (ENV.FIREBASE_WEB_API_KEY) {
      try {
        // Tạo Custom Token từ Admin SDK
        const customToken = await auth.createCustomToken(user.uid);

        // Đổi Custom Token lấy ID Token
        const tokenRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${ENV.FIREBASE_WEB_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
          }
        );

        if (tokenRes.ok) {
          const tokenData = (await tokenRes.json()) as { idToken: string };

          // Yêu cầu Firebase gửi email xác thực
          const sendOobRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${ENV.FIREBASE_WEB_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'VERIFY_EMAIL',
                idToken: tokenData.idToken,
              }),
            }
          );

          if (sendOobRes.ok) {
            console.log(`✉️ [Firebase] Đã gửi email xác thực đến: ${email}`);
            return { sentViaFirebase: true };
          }
        }
      } catch (restError) {
        console.warn('⚠️ [Firebase] Gửi email qua REST API thất bại, chuyển sang tạo link:', restError);
      }
    }

    // 2. Fallback: Tạo link xác thực email
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: false,
    };

    const link = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    console.log(`🔗 [Firebase] Link xác thực email cho ${email}: ${link}`);

    return {
      sentViaFirebase: false,
      link,
    };
  }

  /**
   * Lấy thông tin user theo UID từ Firebase Auth
   */
  static async getUserByUid(uid: string): Promise<UserRecord | null> {
    const auth = this.ensureConfigured();
    try {
      return await auth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin user theo Email từ Firebase Auth
   */
  static async getUserByEmail(email: string): Promise<UserRecord | null> {
    const auth = this.ensureConfigured();
    try {
      return await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái email đã xác thực trên Firebase Auth
   */
  static async markEmailAsVerified(uid: string): Promise<UserRecord> {
    const auth = this.ensureConfigured();
    return await auth.updateUser(uid, {
      emailVerified: true,
    });
  }

  /**
   * Xác thực Firebase ID Token (dành cho client gửi ID Token sau khi đăng nhập / xác thực trên client)
   */
  static async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    const auth = this.ensureConfigured();
    try {
      return await auth.verifyIdToken(idToken);
    } catch (error: any) {
      throw new AppError(
        `Firebase Token không hợp lệ hoặc đã hết hạn: ${error.message || error.code}`,
        HTTP_STATUS.UNAUTHORIZED
      );
    }
  }

  /**
   * Xác thực mã oobCode từ email nếu người dùng gửi oobCode lên API backend
   */
  static async verifyOobCode(oobCode: string): Promise<any> {
    if (!ENV.FIREBASE_WEB_API_KEY) {
      throw new AppError(
        'Chưa cấu hình FIREBASE_WEB_API_KEY để kiểm tra trực tiếp oobCode',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:setAccountInfo?key=${ENV.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode }),
      }
    );

    if (!res.ok) {
      const errorData = (await res.json()) as any;
      throw new AppError(
        `Mã xác thực không hợp lệ hoặc đã hết hạn: ${errorData.error?.message || 'Lỗi không xác định'}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return await res.json();
  }
}

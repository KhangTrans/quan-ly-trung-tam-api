import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { ENV } from './env';

let firebaseApp: App | null = null;
let isConfigured = false;

function initializeFirebase(): void {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0]!;
      isConfigured = true;
      return;
    }

    // 1. Kiểm tra qua đường dẫn file service account
    if (ENV.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const resolvedPath = path.isAbsolute(ENV.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? ENV.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), ENV.FIREBASE_SERVICE_ACCOUNT_PATH);

      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        isConfigured = true;
        console.log('🔥 [Firebase] Đã khởi tạo Firebase Admin từ file serviceAccountKey');
        return;
      } else {
        console.warn(`⚠️ [Firebase] Không tìm thấy file service account tại: ${resolvedPath}`);
      }
    }

    // 2. Kiểm tra qua biến môi trường trực tiếp
    if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      const privateKey = ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      firebaseApp = initializeApp({
        credential: cert({
          projectId: ENV.FIREBASE_PROJECT_ID,
          clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      isConfigured = true;
      console.log('[Firebase] Đã khởi tạo Firebase Admin từ biến môi trường');
      return;
    }

    console.warn(
      '[Firebase] Chưa cấu hình thông tin Firebase Admin (FIREBASE_PROJECT_ID hoặc FIREBASE_SERVICE_ACCOUNT_PATH). Một số chức năng xác thực qua Firebase sẽ bị hạn chế cho đến khi cấu hình.'
    );
  } catch (error) {
    console.error('[Firebase] Lỗi khởi tạo Firebase Admin:', error);
    isConfigured = false;
  }
}

// Khởi chạy khởi tạo ngay khi nạp module
initializeFirebase();

export const isFirebaseReady = (): boolean => isConfigured && firebaseApp !== null;

export const getFirebaseAuth = (): Auth => {
  if (!isFirebaseReady() || !firebaseApp) {
    throw new Error(
      'Firebase Admin chưa được khởi tạo. Vui lòng kiểm tra lại cấu hình Firebase trong file .env'
    );
  }
  return getAuth(firebaseApp);
};

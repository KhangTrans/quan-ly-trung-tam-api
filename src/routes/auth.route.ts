import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  firebaseAuthSchema,
  refreshTokenSchema,
  googleAuthSchema,
} from '../validations/auth.validation';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới & gửi mã OTP xác thực qua email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Matkhau123@
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               role:
 *                 type: string
 *                 enum: [admin, staff, teacher, student]
 *                 default: student
 *     responses:
 *       201:
 *         description: Đăng ký thành công, mã OTP đã gửi qua email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Đăng ký thành công! }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     isEmailVerified: { type: boolean, example: false }
 *                     otpToken: { type: string, example: "1731657492000.e6bedd12a892fa1fe..." }
 *                     expiresInMinutes: { type: number, example: 5 }
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Email đã được đăng ký và kích hoạt trước đó
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Xác thực tài khoản bằng mã OTP và otpToken (Stateless)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - otpToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: Mã OTP 6 chữ số nhận từ email
 *               otpToken:
 *                 type: string
 *                 example: "1731657492000.e6bedd12a892fa1fe..."
 *                 description: Token ký số nhận từ response đăng ký hoặc gửi lại OTP
 *     responses:
 *       200:
 *         description: Xác thực email thành công, trả về JWT Access Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Xác thực email thành công! }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
 *       400:
 *         description: Mã OTP không chính xác hoặc đã hết hạn
 */
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Gửi lại mã OTP mới khi mã cũ hết hạn
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@gmail.com
 *     responses:
 *       200:
 *         description: Đã gửi mã OTP mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Mã OTP mới đã được gửi đến email. }
 *                 data:
 *                   type: object
 *                   properties:
 *                     email: { type: string, example: "nguyenvana@gmail.com" }
 *                     otpToken: { type: string, example: "1731657492000.e6bedd12..." }
 *                     expiresInMinutes: { type: number, example: 5 }
 *       404:
 *         description: Không tìm thấy tài khoản với email này
 */
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập tài khoản bằng Email & Mật khẩu
 *     description: Yêu cầu email đã được xác thực qua OTP trước đó
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Matkhau123@
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT Access Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Đăng nhập thành công }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
 *       401:
 *         description: Sai email hoặc mật khẩu
 *       403:
 *         description: Tài khoản chưa xác thực email (hệ thống sẽ tự động gửi lại OTP) hoặc bị vô hiệu hóa
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token bằng Refresh Token (Token Rotation)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Cấp cặp token mới thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Làm mới Access Token thành công" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     token: { type: string }
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất tài khoản & Thu hồi Refresh Token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Chưa xác thực
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Đăng nhập / Đăng ký nhanh bằng tài khoản Google (Google OAuth 2.0 / GIS)
 *     description: Tiếp nhận Google ID Token hoặc Credential từ Google Identity Services trên Web/Mobile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID Token nhận từ SDK Google
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *               credential:
 *                 type: string
 *                 description: Credential token nhận từ nút Google One Tap / GIS
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về Access Token & Refresh Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Đăng nhập bằng tài khoản Google thành công" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     token: { type: string }
 *       401:
 *         description: Google Token không hợp lệ hoặc đã hết hạn
 */
router.post('/google', validate(googleAuthSchema), AuthController.googleAuth);

/**
 * @swagger
 * /auth/firebase-auth:
 *   post:
 *     summary: Đăng nhập / Đồng bộ tài khoản từ Firebase ID Token
 *     description: Dành cho ứng dụng Web / Mobile Client sử dụng Firebase Auth SDK
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID Token lấy từ client SDK
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Xác thực Firebase thành công, trả về JWT Token của hệ thống Minh Tu Center
 *       400:
 *         description: Token Firebase không hợp lệ
 */
router.post('/firebase-auth', validate(firebaseAuthSchema), AuthController.firebaseAuth);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản đang đăng nhập
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin tài khoản thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ / hết hạn
 */
router.get('/me', authenticate, AuthController.getMe);

export default router;

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ENV } from '../config/env';
import { JwtPayload, RefreshTokenPayload, TokenPair, UserRole } from '../types';
import { FirebaseService } from './firebase.service';
import { MailService } from './mail.service';
import { OtpUtil } from '../utils/otp.util';

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID || undefined);

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface VerifyOtpInput {
  email: string;
  otp: string;
  otpToken: string;
}

export class AuthService {
  /**
   * Tạo cặp Access Token (ngắn hạn) & Refresh Token (dài hạn)
   */
  private static generateTokens(user: IUser): TokenPair {
    const payload: JwtPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshPayload: RefreshTokenPayload = {
      userId: (user._id as any).toString(),
      tokenVersion: user.tokenVersion || 0,
    };

    const refreshToken = jwt.sign(refreshPayload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
    });

    return {
      accessToken,
      refreshToken,
      token: accessToken, // Alias để tương thích ngược với client cũ
    };
  }

  private static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
      expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
    });
  }

  /**
   * Khởi tạo mã OTP, ký số token (Stateless) và gửi mã OTP qua email từ sender "Minh Tu"
   */
  private static async createAndSendOtp(email: string, name?: string) {
    const otp = OtpUtil.generateOtpCode();
    const expiresInMinutes = ENV.OTP_EXPIRES_IN_MINUTES;
    const { otpToken } = OtpUtil.createOtpToken(email, otp, expiresInMinutes);

    // Gửi email với tên hiển thị "Minh Tu"
    const mailResult = await MailService.sendOtpEmail({
      to: email,
      name,
      otp,
      expiresInMinutes,
    });

    return {
      otp,
      otpToken,
      expiresInMinutes,
      sentViaSmtp: mailResult.sentViaSmtp,
    };
  }

  /**
   * Đăng ký tài khoản mới - Gửi mã OTP xác thực qua email (hiệu lực 5 phút)
   * Hướng 1: Nếu email đã đăng ký nhưng CHƯA xác thực, cho phép ghi đè thông tin & gửi lại OTP mới
   */
  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    // Nếu tài khoản đã tồn tại:
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new AppError('Email này đã được sử dụng và kích hoạt. Vui lòng đăng nhập.', HTTP_STATUS.CONFLICT);
      }

      // Tài khoản đã đăng ký nhưng chưa xác thực email (quá 5 phút hoặc chưa nhập OTP)
      // Cho phép cập nhật thông tin mới và gửi mã OTP mới
      existingUser.name = input.name;
      existingUser.password = input.password;
      if (input.phone) existingUser.phone = input.phone;
      if (input.role) existingUser.role = input.role;

      if (FirebaseService.isConfigured() && !existingUser.firebaseUid) {
        try {
          const fbUser = await FirebaseService.createUser({
            email: normalizedEmail,
            password: input.password,
            displayName: input.name,
          });
          existingUser.firebaseUid = fbUser.uid;
        } catch (fbError: any) {
          console.warn('⚠️ [AuthService] Không thể tạo tài khoản trên Firebase:', fbError.message);
        }
      }

      await existingUser.save();

      // Sinh và gửi lại mã OTP mới (5 phút) kèm Stateless otpToken
      const otpResult = await this.createAndSendOtp(normalizedEmail, input.name);

      const userObj = existingUser.toObject();
      delete userObj.password;

      return {
        user: userObj,
        isEmailVerified: false,
        otpToken: otpResult.otpToken,
        expiresInMinutes: otpResult.expiresInMinutes,
        message: `Tài khoản của bạn chưa được kích hoạt trước đó. Mã OTP xác thực mới (hiệu lực trong ${otpResult.expiresInMinutes} phút) đã được gửi đến email ${normalizedEmail}.`,
        ...(ENV.NODE_ENV === 'development' && !otpResult.sentViaSmtp ? { devOtp: otpResult.otp } : {}),
      };
    }

    let firebaseUid: string | undefined;

    // Tích hợp tạo user trên Firebase Auth (nếu đã cấu hình) để đồng bộ hệ sinh thái
    if (FirebaseService.isConfigured()) {
      try {
        const fbUser = await FirebaseService.createUser({
          email: normalizedEmail,
          password: input.password,
          displayName: input.name,
        });
        firebaseUid = fbUser.uid;
      } catch (fbError: any) {
        console.warn('⚠️ [AuthService] Không thể tạo tài khoản trên Firebase:', fbError.message);
      }
    }

    // Lưu người dùng vào MongoDB ở trạng thái chưa kích hoạt
    const newUser = await User.create({
      ...input,
      email: normalizedEmail,
      firebaseUid,
      isEmailVerified: false,
    });

    // Tạo và gửi mã OTP về email của người dùng kèm Stateless otpToken
    const otpResult = await this.createAndSendOtp(normalizedEmail, input.name);

    const userObj = newUser.toObject();
    delete userObj.password;

    return {
      user: userObj,
      isEmailVerified: false,
      otpToken: otpResult.otpToken,
      expiresInMinutes: otpResult.expiresInMinutes,
      message: `Đăng ký thành công! Mã OTP xác thực (có hiệu lực trong ${otpResult.expiresInMinutes} phút) đã được gửi đến email ${normalizedEmail}.`,
      // Hiển thị mã OTP ở response khi đang ở môi trường dev nếu chưa thiết lập SMTP thực tế
      ...(ENV.NODE_ENV === 'development' && !otpResult.sentViaSmtp ? { devOtp: otpResult.otp } : {}),
    };
  }

  /**
   * Xác thực tài khoản bằng mã OTP và otpToken (Stateless - không query DB)
   */
  static async verifyOtp({ email, otp, otpToken }: VerifyOtpInput) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Kiểm tra tính hợp lệ và thời hạn của OTP thông qua chữ ký số HMAC
    const verification = OtpUtil.verifyOtpToken(normalizedEmail, otp, otpToken);
    if (!verification.valid) {
      if (verification.reason === 'EXPIRED') {
        throw new AppError(
          'Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã OTP mới.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      throw new AppError('Mã OTP hoặc token xác thực không chính xác. Vui lòng thử lại.', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Tìm và kích hoạt tài khoản người dùng
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng tương ứng.', HTTP_STATUS.NOT_FOUND);
    }

    user.isEmailVerified = true;
    await user.save();

    // 3. Đồng bộ trạng thái emailVerified lên Firebase nếu có
    if (FirebaseService.isConfigured() && user.firebaseUid) {
      try {
        await FirebaseService.markEmailAsVerified(user.firebaseUid);
      } catch (err: any) {
        console.warn('⚠️ [AuthService] Không thể cập nhật trạng thái Firebase emailVerified:', err.message);
      }
    }

    // 4. Cấp cặp Access Token & Refresh Token
    const tokens = this.generateTokens(user);

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      ...tokens,
      message: 'Xác thực email thành công! Bạn đã được đăng nhập vào hệ thống Minh Tu Center.',
    };
  }

  /**
   * Gửi lại mã OTP xác thực kèm theo Stateless otpToken
   */
  static async resendOtp(email: string) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản với email này.', HTTP_STATUS.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new AppError('Tài khoản này đã được xác thực trước đó.', HTTP_STATUS.BAD_REQUEST);
    }

    const otpResult = await this.createAndSendOtp(user.email, user.name);

    return {
      email: user.email,
      otpToken: otpResult.otpToken,
      expiresInMinutes: otpResult.expiresInMinutes,
      message: `Mã OTP mới (có hiệu lực trong ${otpResult.expiresInMinutes} phút) đã được gửi đến email ${user.email}.`,
      ...(ENV.NODE_ENV === 'development' && !otpResult.sentViaSmtp ? { devOtp: otpResult.otp } : {}),
    };
  }

  /**
   * Đăng nhập tài khoản - Yêu cầu email đã được xác thực OTP
   */
  static async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác', HTTP_STATUS.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không chính xác', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', HTTP_STATUS.FORBIDDEN);
    }

    // Kiểm tra trạng thái xác thực email
    if (!user.isEmailVerified) {
      // Tự động sinh mã OTP mới kèm otpToken gửi qua email
      const otpResult = await this.createAndSendOtp(user.email, user.name);

      throw new AppError(
        'Tài khoản chưa được xác thực email. Một mã OTP mới đã được gửi đến email của bạn, vui lòng nhập OTP để kích hoạt.',
        HTTP_STATUS.FORBIDDEN,
        {
          email: user.email,
          otpToken: otpResult.otpToken,
          expiresInMinutes: otpResult.expiresInMinutes,
          ...(ENV.NODE_ENV === 'development' && !otpResult.sentViaSmtp ? { devOtp: otpResult.otp } : {}),
        }
      );
    }

    const tokens = this.generateTokens(user);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, ...tokens };
  }

  /**
   * Cấp Access Token mới bằng Refresh Token
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as RefreshTokenPayload;

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('Người dùng không còn tồn tại trong hệ thống', HTTP_STATUS.UNAUTHORIZED);
      }

      if (!user.isActive) {
        throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', HTTP_STATUS.FORBIDDEN);
      }

      // Kiểm tra tokenVersion (hỗ trợ thu hồi token khi đăng xuất)
      if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
        throw new AppError(
          'Phiên đăng nhập đã bị thu hồi hoặc bạn đã đăng xuất. Vui lòng đăng nhập lại.',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      // Tạo cặp token mới (Xoay vòng Token / Token Rotation)
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        message: 'Làm mới Access Token thành công',
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token đã hết hạn. Vui lòng đăng nhập lại.', HTTP_STATUS.UNAUTHORIZED);
      }
      throw new AppError('Refresh token không hợp lệ.', HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Đăng xuất - Vô hiệu hóa tất cả các Refresh Token hiện tại của người dùng
   */
  static async logout(userId: string) {
    const user = await User.findById(userId);
    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    }
    return { message: 'Đăng xuất thành công. Phiên đăng nhập hiện tại đã được vô hiệu hóa.' };
  }

  /**
   * Xác thực bằng Firebase ID Token (dành cho Web/Mobile Firebase Client)
   */
  static async firebaseAuthSync(idToken: string) {
    if (!FirebaseService.isConfigured()) {
      throw new AppError('Hệ thống Firebase chưa được cấu hình', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const decodedToken = await FirebaseService.verifyIdToken(idToken);
    if (!decodedToken.email) {
      throw new AppError('Token Firebase không chứa địa chỉ email', HTTP_STATUS.BAD_REQUEST);
    }

    let user = await User.findOne({
      $or: [{ email: decodedToken.email }, { firebaseUid: decodedToken.uid }],
    });

    if (!user) {
      user = await User.create({
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        firebaseUid: decodedToken.uid,
        isEmailVerified: decodedToken.email_verified || false,
        role: 'student',
        avatar: decodedToken.picture || '',
        password: Math.random().toString(36).slice(-8) + 'Aa1!@#',
      });
    } else {
      user.firebaseUid = decodedToken.uid;
      if (decodedToken.email_verified) {
        user.isEmailVerified = true;
      }
      if (decodedToken.picture && !user.avatar) {
        user.avatar = decodedToken.picture;
      }
      await user.save();
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', HTTP_STATUS.FORBIDDEN);
    }

    const tokens = this.generateTokens(user);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, ...tokens };
  }

  /**
   * Đăng nhập hoặc Tự động tạo tài khoản bằng Google OAuth 2.0 (Google ID Token / Credential)
   */
  static async googleAuth(token: string) {
    if (!token) {
      throw new AppError('Google Token không được để trống', HTTP_STATUS.BAD_REQUEST);
    }

    let payload: any;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: ENV.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      throw new AppError(
        `Google Token không hợp lệ hoặc đã hết hạn: ${err.message || ''}`,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (!payload || !payload.email) {
      throw new AppError('Token Google không chứa địa chỉ email người dùng', HTTP_STATUS.BAD_REQUEST);
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const googleId = payload.sub;

    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (!user) {
      // Tự động tạo tài khoản học viên mới
      user = await User.create({
        name: payload.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId,
        isEmailVerified: true, // Google đã xác minh quyền sở hữu email
        role: 'student',
        avatar: payload.picture || '',
        password: Math.random().toString(36).slice(-8) + 'Aa1!@#',
        tokenVersion: 0,
      });
    } else {
      // Liên kết googleId nếu chưa có
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // Đánh dấu email đã xác thực
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
      }
      if (payload.picture && !user.avatar) {
        user.avatar = payload.picture;
      }
      await user.save();
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', HTTP_STATUS.FORBIDDEN);
    }

    const tokens = this.generateTokens(user);
    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      ...tokens,
      message: 'Đăng nhập bằng tài khoản Google thành công',
    };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy thông tin người dùng', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }
}

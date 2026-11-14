import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ENV } from '../config/env';
import { JwtPayload, UserRole } from '../types';

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

export class AuthService {
  private static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any,
    });
  }

  static async register(input: RegisterInput) {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng', HTTP_STATUS.CONFLICT);
    }

    const newUser = await User.create(input);
    const token = this.generateToken({
      userId: (newUser._id as any).toString(),
      email: newUser.email,
      role: newUser.role,
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  static async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email }).select('+password');
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

    const token = this.generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy thông tin người dùng', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuthRequest } from '../types';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyOtp(req.body);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resendOtp(req.body.email);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      ApiResponse.success({
        res,
        data: result,
        message: 'Đăng nhập thành công',
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.body.idToken || req.body.credential;
      const result = await AuthService.googleAuth(token);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async firebaseAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.firebaseAuthSync(req.body.idToken);
      ApiResponse.success({
        res,
        data: result,
        message: 'Xác thực tài khoản Firebase thành công',
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      ApiResponse.success({
        res,
        data: user,
        message: 'Lấy thông tin cá nhân thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updatedUser = await AuthService.updateProfile(req.user!.userId, req.body);
      ApiResponse.success({
        res,
        data: updatedUser,
        message: 'Cập nhật thông tin cá nhân thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changePassword(req.user!.userId, req.body);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.logout(req.user!.userId);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyResetOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyResetOtp(req.body);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body);
      ApiResponse.success({
        res,
        data: result,
        message: result.message,
        statusCode: HTTP_STATUS.OK,
      });
    } catch (error) {
      next(error);
    }
  }
}

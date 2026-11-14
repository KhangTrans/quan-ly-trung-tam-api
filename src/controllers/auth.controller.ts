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
        message: 'Đăng ký tài khoản thành công',
        statusCode: HTTP_STATUS.CREATED,
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
}

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, UserRole } from '../types';
import { ENV } from '../config/env';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Vui lòng đăng nhập để truy cập tài nguyên này', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực người dùng', HTTP_STATUS.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Bạn không có quyền thực hiện thao tác này', HTTP_STATUS.FORBIDDEN)
      );
    }

    next();
  };
};

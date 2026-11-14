import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ENV } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Lỗi hệ thống máy chủ nội bộ (Internal Server Error)';
  let errors = err.errors;

  // Handle Mongoose CastError (Bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Không tìm thấy tài nguyên với định dạng ID: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'Dữ liệu';
    message = `${field} đã tồn tại trong hệ thống`;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Lỗi dữ liệu Model Mongoose';
    errors = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Handle JsonWebToken Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Mã xác thực không hợp lệ (Invalid Token)';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Mã xác thực đã hết hạn (Token Expired)';
  }

  if (ENV.NODE_ENV === 'development' && !(err instanceof AppError)) {
    console.error('[Error Log]:', err);
  }

  ApiResponse.error({
    res,
    statusCode,
    message,
    errors: errors || (ENV.NODE_ENV === 'development' ? err.stack : undefined),
  });
};

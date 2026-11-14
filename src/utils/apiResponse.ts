import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants/httpStatus';

interface SuccessResponseOptions<T> {
  res: Response;
  data?: T;
  message?: string;
  statusCode?: HttpStatusCode;
}

interface ErrorResponseOptions {
  res: Response;
  message?: string;
  statusCode?: HttpStatusCode;
  errors?: any;
}

export class ApiResponse {
  static success<T>({
    res,
    data,
    message = 'Success',
    statusCode = HTTP_STATUS.OK,
  }: SuccessResponseOptions<T>) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error({
    res,
    message = 'An error occurred',
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors,
  }: ErrorResponseOptions) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}

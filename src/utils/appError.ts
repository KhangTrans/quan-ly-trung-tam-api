import { HttpStatusCode, HTTP_STATUS } from '../constants/httpStatus';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: any;

  constructor(message: string, statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

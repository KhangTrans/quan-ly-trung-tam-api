import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ApiResponse } from '../utils/apiResponse';

export const validate = (schema: ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed: any = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // assign parsed data back to req
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        ApiResponse.error({
          res,
          message: 'Dữ liệu đầu vào không hợp lệ (Validation Error)',
          statusCode: HTTP_STATUS.BAD_REQUEST,
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};

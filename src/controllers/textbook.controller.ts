import { Request, Response, NextFunction } from 'express';
import { TextbookService } from '../services/textbook.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';
import { AuthRequest } from '../types';
import { AppError } from '../utils/appError';

export class TextbookController {
  static async getAllTextbooks(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, level, isActive } = req.query;
      const textbooks = await TextbookService.getAllTextbooks({
        search: search as string,
        level: level as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      ApiResponse.success({
        res,
        data: textbooks,
        message: 'Lấy danh sách giáo trình thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTextbookById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const textbook = await TextbookService.getTextbookById(id as string);

      ApiResponse.success({
        res,
        data: textbook,
        message: 'Lấy thông tin giáo trình thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTextbook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const textbook = await TextbookService.createTextbook(req.body, context);

      ApiResponse.success({
        res,
        data: textbook,
        message: 'Thêm giáo trình mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTextbook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const textbook = await TextbookService.updateTextbook(id as string, req.body, context);

      ApiResponse.success({
        res,
        data: textbook,
        message: 'Cập nhật giáo trình thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTextbook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      await TextbookService.deleteTextbook(id as string, context);

      ApiResponse.success({
        res,
        data: null,
        message: 'Xóa giáo trình thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadPdfFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('Vui lòng chọn tệp PDF để tải lên', HTTP_STATUS.BAD_REQUEST);
      }

      const fileUrl = `/uploads/textbooks/${req.file.filename}`;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileSizeFormatted = TextbookService.formatBytes(fileSize);

      ApiResponse.success({
        res,
        data: {
          fileUrl,
          fileName,
          fileSize,
          fileSizeFormatted,
        },
        message: 'Tải tệp PDF giáo trình thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ExamResultService } from '../services/examResult.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';

export class ExamResultController {
  static async getAllExamResults(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ExamResultService.getAllExamResults(req.query);
      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy danh sách kết quả điểm thi thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getExamResultById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ExamResultService.getExamResultById(req.params.id as string);
      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy chi tiết kết quả điểm thi thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createExamResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const result = await ExamResultService.createExamResult(req.body, context);
      ApiResponse.success({
        res,
        data: result,
        statusCode: HTTP_STATUS.CREATED,
        message: 'Nhập điểm thi thành công (Đã ghi nhật ký)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateExamResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const updated = await ExamResultService.updateExamResult(req.params.id as string, req.body, context);
      ApiResponse.success({
        res,
        data: updated,
        message: 'Cập nhật điểm số thành công (Đã ghi nhận nhật ký kiểm toán)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteExamResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const result = await ExamResultService.deleteExamResult(req.params.id as string, context);
      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa kết quả điểm thành công (Đã lưu vết kiểm toán DELETE)',
      });
    } catch (error) {
      next(error);
    }
  }
}

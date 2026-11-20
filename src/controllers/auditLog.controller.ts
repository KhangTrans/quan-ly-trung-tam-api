import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuditLogService } from '../services/auditLog.service';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';

export class AuditLogController {
  /**
   * Get paginated audit logs with search & filters
   */
  static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Seed default sample logs if collection is empty
      await AuditLogService.seedSampleAuditLogsIfEmpty();

      const result = await AuditLogService.getAuditLogs({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 15,
        targetCollection: req.query.targetCollection as string,
        action: req.query.action as string,
        userId: req.query.userId as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });

      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy danh sách nhật ký hệ thống (Audit Logs) thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics of audit logs
   */
  static async getAuditLogStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await AuditLogService.seedSampleAuditLogsIfEmpty();
      const stats = await AuditLogService.getAuditLogStats();

      ApiResponse.success({
        res,
        data: stats,
        message: 'Lấy thống kê nhật ký kiểm toán thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single audit log details by ID
   */
  static async getAuditLogById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await AuditLogService.getAuditLogById(id as string);

      if (!log) {
        throw new AppError('Không tìm thấy bản ghi nhật ký kiểm toán yêu cầu', HTTP_STATUS.NOT_FOUND);
      }

      ApiResponse.success({
        res,
        data: log,
        message: 'Lấy chi tiết bản ghi nhật ký kiểm toán thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

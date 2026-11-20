import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { InvoiceService } from '../services/invoice.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';

export class InvoiceController {
  static async getAllInvoices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await InvoiceService.getAllInvoices(req.query);
      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy danh sách phiếu thu / hóa đơn thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id as string);
      ApiResponse.success({
        res,
        data: invoice,
        message: 'Lấy thông tin chi tiết phiếu thu thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const invoice = await InvoiceService.createInvoice(req.body, context);
      ApiResponse.success({
        res,
        data: invoice,
        statusCode: HTTP_STATUS.CREATED,
        message: 'Lập phiếu thu thành công (Đã ghi nhật ký)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const updated = await InvoiceService.updateInvoice(req.params.id as string, req.body, context);
      ApiResponse.success({
        res,
        data: updated,
        message: 'Cập nhật phiếu thu thành công (Đã ghi nhận nhật ký kiểm toán)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const { reason } = req.body;
      const cancelled = await InvoiceService.cancelInvoice(req.params.id as string, reason, context);
      ApiResponse.success({
        res,
        data: cancelled,
        message: 'Hủy phiếu thu thành công (Đã lưu vết kiểm toán CANCEL)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const result = await InvoiceService.deleteInvoice(req.params.id as string, context);
      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa phiếu thu thành công (Đã lưu vết kiểm toán DELETE)',
      });
    } catch (error) {
      next(error);
    }
  }
}

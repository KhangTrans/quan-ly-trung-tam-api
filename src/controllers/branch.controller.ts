import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../services/branch.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';
import { AuthRequest } from '../types';

export class BranchController {
  static async getAllBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, isActive } = req.query;
      const branches = await BranchService.getAllBranches({
        search: search as string,
        isActive: isActive as string,
      });

      ApiResponse.success({
        res,
        data: branches,
        message: 'Lấy danh sách cơ sở/chi nhánh thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBranchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const branch = await BranchService.getBranchById(id as string);

      ApiResponse.success({
        res,
        data: branch,
        message: 'Lấy thông tin chi tiết chi nhánh thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBranch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const branch = await BranchService.createBranch(req.body, context);

      ApiResponse.success({
        res,
        data: branch,
        message: 'Thêm cơ sở/chi nhánh mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBranch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const branch = await BranchService.updateBranch(id as string, req.body, context);

      ApiResponse.success({
        res,
        data: branch,
        message: 'Cập nhật thông tin chi nhánh thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBranch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const result = await BranchService.deleteBranch(id as string, context);

      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa chi nhánh thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { ClassroomService } from '../services/classroom.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';
import { AuthRequest } from '../types';

export class ClassroomController {
  static async getAllClassrooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, search, isActive } = req.query;
      const classrooms = await ClassroomService.getAllClassrooms({
        branchId: branchId as string,
        search: search as string,
        isActive: isActive as string,
      });

      ApiResponse.success({
        res,
        data: classrooms,
        message: 'Lấy danh sách phòng học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClassroomById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classroom = await ClassroomService.getClassroomById(id as string);

      ApiResponse.success({
        res,
        data: classroom,
        message: 'Lấy thông tin chi tiết phòng học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createClassroom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const classroom = await ClassroomService.createClassroom(req.body, context);

      ApiResponse.success({
        res,
        data: classroom,
        message: 'Thêm phòng học mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateClassroom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const classroom = await ClassroomService.updateClassroom(id as string, req.body, context);

      ApiResponse.success({
        res,
        data: classroom,
        message: 'Cập nhật thông tin phòng học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClassroom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const result = await ClassroomService.deleteClassroom(id as string, context);

      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa phòng học thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

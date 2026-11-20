import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';
import { AuthRequest } from '../types';

export class ClassController {
  static async getAllClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, branchId, courseId, status, teacherId } = req.query;
      const classes = await ClassService.getAllClasses({
        search: search as string,
        branchId: branchId as string,
        courseId: courseId as string,
        status: status as string,
        teacherId: teacherId as string,
      });

      ApiResponse.success({
        res,
        data: classes,
        message: 'Lấy danh sách lớp học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClassById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const classDetail = await ClassService.getClassById(id as string);

      ApiResponse.success({
        res,
        data: classDetail,
        message: 'Lấy thông tin chi tiết lớp học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const newClass = await ClassService.createClass(req.body, context);

      ApiResponse.success({
        res,
        data: newClass,
        message: 'Tạo lớp học mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      const updatedClass = await ClassService.updateClass(id as string, req.body, context);

      ApiResponse.success({
        res,
        data: updatedClass,
        message: 'Cập nhật thông tin lớp học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const context = extractAuditContext(req);
      await ClassService.deleteClass(id as string, context);

      ApiResponse.success({
        res,
        data: null,
        message: 'Xóa lớp học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeachers(_req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await ClassService.getTeachers();

      ApiResponse.success({
        res,
        data: teachers,
        message: 'Lấy danh sách giảng viên thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

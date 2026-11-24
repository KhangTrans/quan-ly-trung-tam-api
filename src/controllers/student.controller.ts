import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { StudentService } from '../services/student.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { extractAuditContext } from '../utils/auditHelper';

export class StudentController {
  static async getAllStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await StudentService.getAllStudents(req.query);
      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy danh sách học viên thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.getStudentById(req.params.id as string);
      ApiResponse.success({
        res,
        data: student,
        message: 'Lấy thông tin học viên thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const student = await StudentService.createStudent(req.body, context);
      ApiResponse.success({
        res,
        data: student,
        statusCode: HTTP_STATUS.CREATED,
        message: 'Thêm mới học viên thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const updated = await StudentService.updateStudent(req.params.id as string, req.body, context);
      ApiResponse.success({
        res,
        data: updated,
        message: 'Cập nhật thông tin học viên thành công (Đã ghi nhận nhật ký kiểm toán)',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const context = extractAuditContext(req);
      const result = await StudentService.deleteStudent(req.params.id as string, context);
      ApiResponse.success({
        res,
        data: result,
        message: 'Xóa học viên thành công (Đã lưu vết kiểm toán)',
      });
    } catch (error) {
      next(error);
    }
  }
}

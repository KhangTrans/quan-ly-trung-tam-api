import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export class EnrollmentController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const enrollment = await EnrollmentService.registerEnrollment(req.body);
      ApiResponse.success({
        res,
        data: enrollment,
        message: 'Đăng ký tư vấn / khóa học thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.query;
      const enrollments = await EnrollmentService.getAllEnrollments(courseId as string);
      ApiResponse.success({
        res,
        data: enrollments,
        message: 'Lấy danh sách đăng ký thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await EnrollmentService.updateStatus(id as string, status);
      ApiResponse.success({
        res,
        data: updated,
        message: 'Cập nhật trạng thái đăng ký thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

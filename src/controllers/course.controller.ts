import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { ApiResponse } from '../utils/apiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export class CourseController {
  static async getAllCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { level, status, search, page, limit } = req.query;

      const result = await CourseService.getAllCourses({
        level: level as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      ApiResponse.success({
        res,
        data: result,
        message: 'Lấy danh sách khóa học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const course = await CourseService.getCourseById(id as string);

      ApiResponse.success({
        res,
        data: course,
        message: 'Lấy thông tin chi tiết khóa học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.createCourse(req.body);

      ApiResponse.success({
        res,
        data: course,
        message: 'Tạo khóa học mới thành công',
        statusCode: HTTP_STATUS.CREATED,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const course = await CourseService.updateCourse(id as string, req.body);

      ApiResponse.success({
        res,
        data: course,
        message: 'Cập nhật thông tin khóa học thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CourseService.deleteCourse(id as string);

      ApiResponse.success({
        res,
        message: 'Xóa khóa học thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

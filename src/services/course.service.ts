import { Course, ICourse } from '../models/course.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

interface CourseFilterOptions {
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CourseService {
  static async getAllCourses(options: CourseFilterOptions) {
    const { level, status, search, page = 1, limit = 10 } = options;
    const query: any = {};

    if (level) {
      query.level = level;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Course.countDocuments(query),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCourseById(id: string) {
    const course = await Course.findById(id);
    if (!course) {
      throw new AppError('Khóa học không tồn tại', HTTP_STATUS.NOT_FOUND);
    }
    return course;
  }

  static async createCourse(data: Partial<ICourse>) {
    const existingCode = await Course.findOne({ code: data.code });
    if (existingCode) {
      throw new AppError(`Mã khóa học '${data.code}' đã tồn tại`, HTTP_STATUS.CONFLICT);
    }
    return await Course.create(data);
  }

  static async updateCourse(id: string, data: Partial<ICourse>) {
    if (data.code) {
      const existing = await Course.findOne({ code: data.code, _id: { $ne: id } });
      if (existing) {
        throw new AppError(`Mã khóa học '${data.code}' đã tồn tại`, HTTP_STATUS.CONFLICT);
      }
    }

    const course = await Course.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      throw new AppError('Không tìm thấy khóa học để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    return course;
  }

  static async deleteCourse(id: string) {
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học để xóa', HTTP_STATUS.NOT_FOUND);
    }
    return course;
  }
}

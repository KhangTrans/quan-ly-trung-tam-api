import { Course, ICourse, Class } from '../models';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';

const COURSE_FIELD_LABELS: Record<string, string> = {
  title: 'Tên khóa học',
  code: 'Mã khóa học',
  level: 'Trình độ tiếng Nhật',
  textbook: 'Giáo trình áp dụng',
  totalSessions: 'Tổng số buổi học',
  tuitionFee: 'Học phí chuẩn',
  duration: 'Thời lượng dự kiến',
  maxStudents: 'Sĩ số tối đa',
  status: 'Trạng thái',
  isActive: 'Kích hoạt',
  description: 'Mô tả',
};

interface CourseFilterOptions {
  level?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CourseService {
  static async getAllCourses(options: CourseFilterOptions = {}) {
    const { level, status, search, page = 1, limit = 100 } = options;
    const query: any = {};

    if (level && level !== 'all') {
      query.level = level;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { textbook: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query).populate('textbookId').sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    const course = await Course.findById(id).populate('textbookId');
    if (!course) {
      throw new AppError('Khóa học không tồn tại', HTTP_STATUS.NOT_FOUND);
    }
    const relatedClasses = await Class.find({ courseId: id })
      .populate('branchId', 'name code')
      .populate('primaryTeacherId', 'name email avatar')
      .populate('shiftSlotId', 'name startTime endTime')
      .sort({ createdAt: -1 });

    return {
      ...course.toObject(),
      classes: relatedClasses,
    };
  }

  static async createCourse(data: Partial<ICourse>, context?: UserAuditContext) {
    const codeUpper = data.code?.trim().toUpperCase();
    const existingCode = await Course.findOne({ code: codeUpper });
    if (existingCode) {
      throw new AppError(`Mã khóa học '${codeUpper}' đã tồn tại`, HTTP_STATUS.CONFLICT);
    }

    const course = await Course.create({
      ...data,
      code: codeUpper,
    });

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'CREATE',
        targetCollection: 'courses',
        targetId: course._id,
        description: `Tạo chương trình đào tạo / khóa học mới: ${course.title} (Mã: ${course.code})`,
        newData: course.toObject(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return course;
  }

  static async updateCourse(id: string, data: Partial<ICourse>, context?: UserAuditContext) {
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      throw new AppError('Không tìm thấy khóa học để cập nhật', HTTP_STATUS.NOT_FOUND);
    }
    const oldSnapshot = existingCourse.toObject();

    if (data.code) {
      const codeUpper = data.code.trim().toUpperCase();
      const duplicate = await Course.findOne({ code: codeUpper, _id: { $ne: id } });
      if (duplicate) {
        throw new AppError(`Mã khóa học '${codeUpper}' đã được sử dụng bởi khóa học khác`, HTTP_STATUS.CONFLICT);
      }
      data.code = codeUpper;
    }

    const updated = await Course.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new AppError('Không tìm thấy khóa học để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    if (context) {
      const newSnapshot = updated.toObject();
      const changedFields = computeDiff(oldSnapshot, newSnapshot, COURSE_FIELD_LABELS);
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'UPDATE',
        targetCollection: 'courses',
        targetId: updated._id,
        description: `Chỉnh sửa thông tin khóa học: ${updated.title} (Mã: ${updated.code})`,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return updated;
  }

  static async deleteCourse(id: string, context?: UserAuditContext) {
    const classCount = await Class.countDocuments({ courseId: id });
    if (classCount > 0) {
      throw new AppError(
        `Không thể xóa khóa học này vì đang có ${classCount} lớp học liên kết. Vui lòng chuyển hoặc xóa các lớp liên quan trước.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const existing = await Course.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy khóa học để xóa', HTTP_STATUS.NOT_FOUND);
    }
    const oldSnapshot = existing.toObject();

    await Course.findByIdAndDelete(id);

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'DELETE',
        targetCollection: 'courses',
        targetId: existing._id,
        description: `Xóa khóa học: ${existing.title} (Mã: ${existing.code})`,
        oldData: oldSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return existing;
  }
}

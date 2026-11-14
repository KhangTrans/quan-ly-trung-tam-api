import { Enrollment, IEnrollment, EnrollmentStatus } from '../models/enrollment.model';
import { Class } from '../models/class.model';
import { Student } from '../models/student.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

export class EnrollmentService {
  static async registerEnrollment(data: Partial<IEnrollment>) {
    const classItem = await Class.findById(data.classId);
    if (!classItem) {
      throw new AppError('Lớp học không tồn tại', HTTP_STATUS.NOT_FOUND);
    }

    const student = await Student.findById(data.studentId);
    if (!student) {
      throw new AppError('Học viên không tồn tại', HTTP_STATUS.NOT_FOUND);
    }

    const existing = await Enrollment.findOne({
      studentId: data.studentId,
      classId: data.classId,
    });

    if (existing) {
      throw new AppError('Học viên đã được ghi danh vào lớp học này', HTTP_STATUS.CONFLICT);
    }

    const enrollment = await Enrollment.create(data);

    // Tăng sĩ số lớp học
    await Class.findByIdAndUpdate(data.classId, {
      $inc: { currentStudentCount: 1 },
    });

    return enrollment;
  }

  static async getAllEnrollments(classId?: string) {
    const filter = classId ? { classId } : {};
    return await Enrollment.find(filter)
      .populate('studentId', 'fullName studentCode phone email')
      .populate({
        path: 'classId',
        select: 'name classCode startDate shiftSlotId',
        populate: { path: 'courseId', select: 'title level tuitionFee' },
      })
      .sort({ createdAt: -1 });
  }

  static async updateStatus(id: string, status: EnrollmentStatus) {
    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!enrollment) {
      throw new AppError('Không tìm thấy thông tin đăng ký', HTTP_STATUS.NOT_FOUND);
    }
    return enrollment;
  }
}

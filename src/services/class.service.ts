import mongoose from 'mongoose';
import { Class, IClass, Course, Branch, Classroom, ShiftSlot, User, Enrollment } from '../models';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';

const CLASS_FIELD_LABELS: Record<string, string> = {
  name: 'Tên lớp học',
  classCode: 'Mã lớp',
  primaryTeacherId: 'Giảng viên phụ trách',
  defaultClassroomId: 'Phòng học chính',
  shiftSlotId: 'Ca học',
  daysOfWeek: 'Lịch học các thứ trong tuần',
  startDate: 'Ngày khai giảng',
  endDateExpected: 'Ngày kết thúc dự kiến',
  maxStudents: 'Sĩ số tối đa',
  status: 'Trạng thái lớp',
  notes: 'Ghi chú lớp',
};

export interface ClassFilterOptions {
  search?: string;
  branchId?: string;
  courseId?: string;
  status?: string;
  teacherId?: string;
}

export class ClassService {
  /**
   * Lấy danh sách tất cả các lớp học kèm bộ lọc và populate chi tiết
   */
  static async getAllClasses(filters: ClassFilterOptions = {}): Promise<IClass[]> {
    const query: any = {};

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { classCode: searchRegex }, { notes: searchRegex }];
    }

    if (filters.branchId && filters.branchId !== 'all') {
      query.branchId = filters.branchId;
    }

    if (filters.courseId && filters.courseId !== 'all') {
      query.courseId = filters.courseId;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.teacherId && filters.teacherId !== 'all') {
      query.primaryTeacherId = filters.teacherId;
    }

    return await Class.find(query)
      .populate('courseId', 'title code level tuitionFee totalSessions textbook')
      .populate('branchId', 'name code address phone email')
      .populate('primaryTeacherId', 'name email phone avatar role')
      .populate('defaultClassroomId', 'roomCode capacity facilities')
      .populate('shiftSlotId', 'name startTime endTime period')
      .sort({ createdAt: -1 });
  }

  /**
   * Lấy thông tin chi tiết một lớp học kèm danh sách học viên ghi danh
   */
  static async getClassById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã ID lớp học không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const cls = await Class.findById(id)
      .populate('courseId')
      .populate('branchId')
      .populate('primaryTeacherId', 'name email phone avatar role')
      .populate('defaultClassroomId')
      .populate('shiftSlotId');

    if (!cls) {
      throw new AppError('Không tìm thấy lớp học', HTTP_STATUS.NOT_FOUND);
    }

    // Lấy danh sách học viên ghi danh trong lớp này
    const enrollments = await Enrollment.find({ classId: id })
      .populate('studentId', 'studentCode fullName phone email dob gender status')
      .sort({ createdAt: -1 });

    return {
      ...cls.toObject(),
      enrollments,
    };
  }

  /**
   * Kiểm tra trùng lịch học (Phòng học, Giảng viên, Ca học và Các thứ trong tuần)
   */
  static async checkScheduleConflict(
    data: {
      defaultClassroomId: string;
      primaryTeacherId: string;
      shiftSlotId: string;
      daysOfWeek: number[];
      startDate: string | Date;
      endDateExpected?: string | Date | null;
      status?: string;
    },
    excludeClassId?: string
  ): Promise<void> {
    // Không kiểm tra xung đột với lớp đã kết thúc hoặc đã hủy
    if (data.status && ['completed', 'cancelled'].includes(data.status)) {
      return;
    }

    if (!data.defaultClassroomId || !data.primaryTeacherId || !data.shiftSlotId) {
      return;
    }

    // Tìm tất cả các lớp đang hoạt động (upcoming hoặc ongoing) có cùng ca học
    // và có cùng phòng học HOẶC cùng giảng viên
    const query: any = {
      status: { $in: ['upcoming', 'ongoing'] },
      shiftSlotId: data.shiftSlotId,
      $or: [
        { defaultClassroomId: data.defaultClassroomId },
        { primaryTeacherId: data.primaryTeacherId },
      ],
    };

    if (excludeClassId) {
      query._id = { $ne: excludeClassId };
    }

    const candidates = await Class.find(query)
      .populate('defaultClassroomId', 'roomCode capacity')
      .populate('primaryTeacherId', 'name email role')
      .populate('shiftSlotId', 'name startTime endTime');

    if (!candidates || candidates.length === 0) {
      return;
    }

    const newStart = new Date(data.startDate).getTime();
    // Nếu không có ngày kết thúc dự kiến, mặc định coi như lớp kéo dài tối thiểu 6 tháng
    const newEnd = data.endDateExpected
      ? new Date(data.endDateExpected).getTime()
      : newStart + 180 * 24 * 60 * 60 * 1000;

    const newDays = (data.daysOfWeek || []).map(Number);

    for (const candidate of candidates) {
      // 1. Kiểm tra thứ trong tuần có trùng không
      const candDays = (candidate.daysOfWeek || []).map(Number);
      const commonDays = newDays.filter((d) => candDays.includes(d));
      if (commonDays.length === 0) {
        // Không trùng ngày nào trong tuần (ví dụ 1 bên T2-4-6, 1 bên T3-5-7)
        continue;
      }

      // 2. Kiểm tra khoảng thời gian khai giảng - bế giảng có giao nhau không
      const candStart = new Date(candidate.startDate).getTime();
      const candEnd = candidate.endDateExpected
        ? new Date(candidate.endDateExpected).getTime()
        : candStart + 180 * 24 * 60 * 60 * 1000;

      const isDateOverlapping = newStart <= candEnd && newEnd >= candStart;
      if (!isDateOverlapping) {
        // Khoảng thời gian khác nhau, không xung đột
        continue;
      }

      // 3. Xác định xung đột phòng hay giảng viên
      const candRoomId = candidate.defaultClassroomId?._id
        ? candidate.defaultClassroomId._id.toString()
        : candidate.defaultClassroomId?.toString();
      const targetRoomId = data.defaultClassroomId.toString();
      const isRoomConflict = candRoomId === targetRoomId;

      const candTeacherId = candidate.primaryTeacherId?._id
        ? candidate.primaryTeacherId._id.toString()
        : candidate.primaryTeacherId?.toString();
      const targetTeacherId = data.primaryTeacherId.toString();
      const isTeacherConflict = candTeacherId === targetTeacherId;

      const shiftInfo = candidate.shiftSlotId as any;
      const shiftName = shiftInfo
        ? shiftInfo.startTime && shiftInfo.endTime && !shiftInfo.name?.includes(shiftInfo.startTime)
          ? `${shiftInfo.name} (${shiftInfo.startTime} - ${shiftInfo.endTime})`
          : shiftInfo.name
        : 'Ca học này';

      const commonDaysStr = commonDays
        .sort((a, b) => a - b)
        .map((d) => (d === 8 ? 'Chủ Nhật' : `Thứ ${d}`))
        .join(', ');

      const roomCode = (candidate.defaultClassroomId as any)?.roomCode || 'này';
      const teacherName = (candidate.primaryTeacherId as any)?.name || 'này';

      if (isRoomConflict && isTeacherConflict) {
        throw new AppError(
          `Trùng lịch: Phòng ${roomCode} và Giảng viên ${teacherName} đều đã được xếp cho lớp "${candidate.name}" (${candidate.classCode}) vào ${shiftName} các ngày [${commonDaysStr}]. Vui lòng chọn phòng học, giảng viên hoặc thời gian khác!`,
          HTTP_STATUS.CONFLICT
        );
      }

      if (isRoomConflict) {
        throw new AppError(
          `Trùng lịch phòng học: Phòng ${roomCode} đã được xếp cho lớp "${candidate.name}" (${candidate.classCode}) vào ${shiftName} các ngày [${commonDaysStr}]. Vui lòng chọn phòng học hoặc ca học khác!`,
          HTTP_STATUS.CONFLICT
        );
      }

      if (isTeacherConflict) {
        throw new AppError(
          `Trùng lịch giảng viên: Giảng viên ${teacherName} đã có lịch dạy lớp "${candidate.name}" (${candidate.classCode}) vào ${shiftName} các ngày [${commonDaysStr}]. Vui lòng chọn giảng viên hoặc ca học khác!`,
          HTTP_STATUS.CONFLICT
        );
      }
    }
  }

  /**
   * Tạo một lớp học mới
   */
  static async createClass(data: any, context?: UserAuditContext): Promise<IClass> {
    const existing = await Class.findOne({ classCode: data.classCode.toUpperCase() });
    if (existing) {
      throw new AppError(`Mã lớp học "${data.classCode}" đã tồn tại trên hệ thống`, HTTP_STATUS.CONFLICT);
    }

    // Kiểm tra xung đột phòng học, giảng viên, ca học và các thứ trong tuần
    await ClassService.checkScheduleConflict(data);

    const newClass = await Class.create({
      ...data,
      classCode: data.classCode.toUpperCase(),
    });

    const populated = await Class.findById(newClass._id)
      .populate('courseId', 'title code level tuitionFee totalSessions textbook')
      .populate('branchId', 'name code address phone email')
      .populate('primaryTeacherId', 'name email phone avatar role')
      .populate('defaultClassroomId', 'roomCode capacity facilities')
      .populate('shiftSlotId', 'name startTime endTime period');

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'CREATE',
        targetCollection: 'classes',
        targetId: newClass._id,
        description: `Tạo lớp học mới: ${newClass.name} (Mã: ${newClass.classCode})`,
        newData: newClass.toObject(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return populated!;
  }

  /**
   * Cập nhật thông tin lớp học
   */
  static async updateClass(id: string, data: any, context?: UserAuditContext): Promise<IClass> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã ID lớp học không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingClass = await Class.findById(id);
    if (!existingClass) {
      throw new AppError('Không tìm thấy lớp học để cập nhật', HTTP_STATUS.NOT_FOUND);
    }
    const oldSnapshot = existingClass.toObject();

    if (data.classCode) {
      const codeUpper = data.classCode.toUpperCase();
      const duplicate = await Class.findOne({ classCode: codeUpper, _id: { $ne: id } });
      if (duplicate) {
        throw new AppError(`Mã lớp học "${codeUpper}" đã được sử dụng bởi lớp khác`, HTTP_STATUS.CONFLICT);
      }
      data.classCode = codeUpper;
    }

    // Kiểm tra xung đột lịch học khi cập nhật
    const mergedData = {
      defaultClassroomId: data.defaultClassroomId || existingClass.defaultClassroomId.toString(),
      primaryTeacherId: data.primaryTeacherId || existingClass.primaryTeacherId.toString(),
      shiftSlotId: data.shiftSlotId || existingClass.shiftSlotId.toString(),
      daysOfWeek: data.daysOfWeek || existingClass.daysOfWeek,
      startDate: data.startDate || existingClass.startDate,
      endDateExpected: data.endDateExpected !== undefined ? data.endDateExpected : existingClass.endDateExpected,
      status: data.status || existingClass.status,
    };
    await ClassService.checkScheduleConflict(mergedData, id);

    const updated = await Class.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('courseId', 'title code level tuitionFee totalSessions textbook')
      .populate('branchId', 'name code address phone email')
      .populate('primaryTeacherId', 'name email phone avatar role')
      .populate('defaultClassroomId', 'roomCode capacity facilities')
      .populate('shiftSlotId', 'name startTime endTime period');

    if (!updated) {
      throw new AppError('Không tìm thấy lớp học để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    if (context) {
      const newSnapshot = updated.toObject();
      const changedFields = computeDiff(oldSnapshot, newSnapshot, CLASS_FIELD_LABELS);
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'UPDATE',
        targetCollection: 'classes',
        targetId: updated._id,
        description: `Chỉnh sửa thông tin lớp học: ${updated.name} (Mã: ${updated.classCode})`,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return updated;
  }

  /**
   * Xóa một lớp học
   */
  static async deleteClass(id: string, context?: UserAuditContext): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã ID lớp học không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await Class.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy lớp học để xóa', HTTP_STATUS.NOT_FOUND);
    }

    const enrollmentCount = await Enrollment.countDocuments({ classId: id });
    if (enrollmentCount > 0) {
      throw new AppError(
        `Không thể xóa lớp học này vì đang có ${enrollmentCount} học viên đã ghi danh. Vui lòng chuyển lớp hoặc xóa ghi danh trước.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const oldSnapshot = existing.toObject();
    await Class.findByIdAndDelete(id);

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'DELETE',
        targetCollection: 'classes',
        targetId: existing._id,
        description: `Xóa lớp học: ${existing.name} (Mã: ${existing.classCode})`,
        oldData: oldSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }
  }

  /**
   * Lấy danh sách giảng viên & nhân sự có thể phụ trách giảng dạy
   */
  static async getTeachers(): Promise<any[]> {
    return await User.find(
      { role: { $in: ['teacher', 'admin', 'staff'] }, isActive: true },
      'name email phone avatar role'
    ).sort({ name: 1 });
  }
}

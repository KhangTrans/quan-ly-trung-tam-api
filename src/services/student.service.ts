import mongoose from 'mongoose';
import { Student, IStudent } from '../models/student.model';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

const STUDENT_FIELD_LABELS: Record<string, string> = {
  fullName: 'Họ và tên học viên',
  studentCode: 'Mã học viên',
  phone: 'Số điện thoại',
  email: 'Địa chỉ Email',
  address: 'Địa chỉ cư trú',
  gender: 'Giới tính',
  dob: 'Ngày sinh',
  inputLevel: 'Trình độ đầu vào',
  learningObjective: 'Mục tiêu học tập',
  status: 'Trạng thái học tập',
  notes: 'Ghi chú học viên',
};

export class StudentService {
  static async getAllStudents(query: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: regex },
        { studentCode: regex },
        { phone: regex },
        { email: regex },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Student.countDocuments(filter),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getStudentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã học viên không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }
    const student = await Student.findById(id).lean();
    if (!student) {
      throw new AppError('Không tìm thấy học viên', HTTP_STATUS.NOT_FOUND);
    }
    return student;
  }

  static async createStudent(data: Partial<IStudent>, context: UserAuditContext) {
    // Generate code if not provided
    if (!data.studentCode) {
      const count = await Student.countDocuments();
      data.studentCode = `MT-HV-${String(count + 1).padStart(5, '0')}`;
    }

    const student = await Student.create(data);

    // Record Audit Log: CREATE
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'CREATE',
      targetCollection: 'students',
      targetId: student._id,
      description: `Thêm mới hồ sơ học viên: ${student.fullName} (Mã: ${student.studentCode})`,
      newData: student.toObject(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return student;
  }

  static async updateStudent(id: string, updateData: Partial<IStudent>, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã học viên không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      throw new AppError('Không tìm thấy học viên để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingStudent.toObject();

    // Update fields
    Object.assign(existingStudent, updateData);
    const updatedStudent = await existingStudent.save();
    const newSnapshot = updatedStudent.toObject();

    // Compute diff of changed fields
    const changedFields = computeDiff(oldSnapshot, newSnapshot, STUDENT_FIELD_LABELS);

    // Record Audit Log: UPDATE (Quan trọng: Lưu vết chỉnh sửa học viên)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'UPDATE',
      targetCollection: 'students',
      targetId: updatedStudent._id,
      description: `Chỉnh sửa dữ liệu học viên ${updatedStudent.fullName} (Mã: ${updatedStudent.studentCode}) - Thay đổi ${changedFields.length} trường thông tin`,
      changedFields,
      oldData: oldSnapshot,
      newData: newSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updatedStudent;
  }

  static async deleteStudent(id: string, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã học viên không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      throw new AppError('Không tìm thấy học viên để xóa', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingStudent.toObject();
    await Student.findByIdAndDelete(id);

    // Record Audit Log: DELETE (Quan trọng: Lưu vết xóa học viên)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'DELETE',
      targetCollection: 'students',
      targetId: new mongoose.Types.ObjectId(id),
      description: `Xóa dữ liệu hồ sơ học viên: ${existingStudent.fullName} (Mã: ${existingStudent.studentCode})`,
      oldData: oldSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { message: 'Đã xóa học viên và lưu lịch sử kiểm toán thành công', student: oldSnapshot };
  }
}

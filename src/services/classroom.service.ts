import { Classroom, IClassroom } from '../models/classroom.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';

const CLASSROOM_FIELD_LABELS: Record<string, string> = {
  roomCode: 'Mã phòng học',
  capacity: 'Sức chứa tối đa',
  facilities: 'Trang thiết bị',
  isActive: 'Trạng thái sử dụng',
};

export class ClassroomService {
  static async getAllClassrooms(query?: { branchId?: string; search?: string; isActive?: boolean | string }) {
    const filter: Record<string, any> = {};

    if (query?.branchId) {
      filter.branchId = query.branchId;
    }

    if (query?.search) {
      filter.$or = [
        { roomCode: { $regex: query.search, $options: 'i' } },
        { facilities: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query?.isActive !== undefined && query.isActive !== '') {
      filter.isActive = String(query.isActive) === 'true';
    }

    return await Classroom.find(filter)
      .populate('branchId', 'name code address phone')
      .sort({ roomCode: 1 });
  }

  static async getClassroomById(id: string) {
    const classroom = await Classroom.findById(id).populate('branchId', 'name code address phone');
    if (!classroom) {
      throw new AppError('Không tìm thấy phòng học', HTTP_STATUS.NOT_FOUND);
    }
    return classroom;
  }

  static async createClassroom(data: Partial<IClassroom>, context?: UserAuditContext) {
    const roomCode = data.roomCode?.trim().toUpperCase();
    const existing = await Classroom.findOne({
      branchId: data.branchId,
      roomCode,
    });

    if (existing) {
      throw new AppError(`Mã phòng học "${roomCode}" đã tồn tại tại cơ sở này`, HTTP_STATUS.BAD_REQUEST);
    }

    const classroom = await Classroom.create({
      ...data,
      roomCode,
    });
    const populated = await classroom.populate('branchId', 'name code address phone');

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'CREATE',
        targetCollection: 'classrooms',
        targetId: classroom._id,
        description: `Thêm phòng học mới ${classroom.roomCode} (Sức chứa: ${classroom.capacity || 'N/A'})`,
        newData: classroom.toObject(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return populated;
  }

  static async updateClassroom(id: string, data: Partial<IClassroom>, context?: UserAuditContext) {
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new AppError('Không tìm thấy phòng học', HTTP_STATUS.NOT_FOUND);
    }

    const targetBranchId = data.branchId || classroom.branchId;
    const targetRoomCode = data.roomCode ? data.roomCode.trim().toUpperCase() : classroom.roomCode;

    if (
      String(targetBranchId) !== String(classroom.branchId) ||
      targetRoomCode !== classroom.roomCode
    ) {
      const existing = await Classroom.findOne({
        _id: { $ne: id },
        branchId: targetBranchId,
        roomCode: targetRoomCode,
      });
      if (existing) {
        throw new AppError(`Mã phòng học "${targetRoomCode}" đã tồn tại tại cơ sở này`, HTTP_STATUS.BAD_REQUEST);
      }
    }

    if (data.roomCode) {
      data.roomCode = targetRoomCode;
    }

    const oldSnapshot = classroom.toObject();
    Object.assign(classroom, data);
    const updated = await classroom.save();
    const newSnapshot = updated.toObject();

    if (context) {
      const changedFields = computeDiff(oldSnapshot, newSnapshot, CLASSROOM_FIELD_LABELS);
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'UPDATE',
        targetCollection: 'classrooms',
        targetId: updated._id,
        description: `Chỉnh sửa thông tin phòng học ${updated.roomCode}`,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return await classroom.populate('branchId', 'name code address phone');
  }

  static async deleteClassroom(id: string, context?: UserAuditContext) {
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new AppError('Không tìm thấy phòng học', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = classroom.toObject();
    await Classroom.findByIdAndDelete(id);

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'DELETE',
        targetCollection: 'classrooms',
        targetId: classroom._id,
        description: `Xóa phòng học: ${classroom.roomCode}`,
        oldData: oldSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return { id, message: 'Đã xóa phòng học thành công' };
  }
}

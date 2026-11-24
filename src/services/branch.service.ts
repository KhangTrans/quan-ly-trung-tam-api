import { Branch, IBranch } from '../models/branch.model';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';

const BRANCH_FIELD_LABELS: Record<string, string> = {
  name: 'Tên cơ sở / chi nhánh',
  code: 'Mã cơ sở',
  address: 'Địa chỉ cơ sở',
  phone: 'Số điện thoại liên hệ',
  email: 'Email cơ sở',
  isActive: 'Trạng thái hoạt động',
};

export class BranchService {
  static async getAllBranches(query?: { search?: string; isActive?: boolean | string }) {
    const filter: Record<string, any> = {};

    if (query?.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { address: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query?.isActive !== undefined && query.isActive !== '') {
      filter.isActive = String(query.isActive) === 'true';
    }

    return await Branch.find(filter).sort({ createdAt: -1 });
  }

  static async getBranchById(id: string) {
    const branch = await Branch.findById(id);
    if (!branch) {
      throw new AppError('Không tìm thấy cơ sở/chi nhánh', HTTP_STATUS.NOT_FOUND);
    }
    return branch;
  }

  static async createBranch(data: Partial<IBranch>, context?: UserAuditContext) {
    const code = data.code?.trim().toUpperCase();
    const existing = await Branch.findOne({ code });
    if (existing) {
      throw new AppError(`Mã chi nhánh "${code}" đã tồn tại trong hệ thống`, HTTP_STATUS.BAD_REQUEST);
    }

    const branch = await Branch.create({
      ...data,
      code,
    });

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'CREATE',
        targetCollection: 'branches',
        targetId: branch._id,
        description: `Thêm mới cơ sở/chi nhánh: ${branch.name} (Mã: ${branch.code})`,
        newData: branch.toObject(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return branch;
  }

  static async updateBranch(id: string, data: Partial<IBranch>, context?: UserAuditContext) {
    const branch = await Branch.findById(id);
    if (!branch) {
      throw new AppError('Không tìm thấy cơ sở/chi nhánh', HTTP_STATUS.NOT_FOUND);
    }

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      if (code !== branch.code) {
        const existing = await Branch.findOne({ code });
        if (existing) {
          throw new AppError(`Mã chi nhánh "${code}" đã tồn tại trong hệ thống`, HTTP_STATUS.BAD_REQUEST);
        }
        data.code = code;
      }
    }

    const oldSnapshot = branch.toObject();
    Object.assign(branch, data);
    const updated = await branch.save();
    const newSnapshot = updated.toObject();

    if (context) {
      const changedFields = computeDiff(oldSnapshot, newSnapshot, BRANCH_FIELD_LABELS);
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'UPDATE',
        targetCollection: 'branches',
        targetId: updated._id,
        description: `Chỉnh sửa thông tin cơ sở/chi nhánh ${updated.name} (Mã: ${updated.code})`,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return updated;
  }

  static async deleteBranch(id: string, context?: UserAuditContext) {
    const branch = await Branch.findById(id);
    if (!branch) {
      throw new AppError('Không tìm thấy cơ sở/chi nhánh', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = branch.toObject();
    await Branch.findByIdAndDelete(id);

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'DELETE',
        targetCollection: 'branches',
        targetId: branch._id,
        description: `Xóa cơ sở/chi nhánh: ${branch.name} (Mã: ${branch.code})`,
        oldData: oldSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return { id, message: 'Đã xóa chi nhánh thành công' };
  }
}

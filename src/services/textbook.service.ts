import { Textbook, ITextbook, Course } from '../models';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';

const TEXTBOOK_FIELD_LABELS: Record<string, string> = {
  name: 'Tên giáo trình',
  code: 'Mã giáo trình',
  level: 'Cấp độ',
  author: 'Tác giả',
  publisher: 'Nhà xuất bản',
  totalLessons: 'Số bài học',
  fileUrl: 'Đường dẫn file PDF',
  fileName: 'Tên file',
  fileSizeFormatted: 'Dung lượng file',
  description: 'Mô tả',
  isActive: 'Trạng thái hoạt động',
};

export interface TextbookFilterOptions {
  search?: string;
  level?: string;
  isActive?: boolean;
}

export class TextbookService {
  static formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  static async getAllTextbooks(filters: TextbookFilterOptions = {}): Promise<ITextbook[]> {
    const query: any = {};

    if (filters.level && filters.level !== 'all') {
      query.level = filters.level;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { code: searchRegex }, { author: searchRegex }, { description: searchRegex }];
    }

    return await Textbook.find(query).sort({ createdAt: -1 });
  }

  static async getTextbookById(id: string): Promise<ITextbook> {
    const textbook = await Textbook.findById(id);
    if (!textbook) {
      throw new AppError('Không tìm thấy giáo trình tài liệu', HTTP_STATUS.NOT_FOUND);
    }
    return textbook;
  }

  static async createTextbook(data: Partial<ITextbook>, context?: UserAuditContext): Promise<ITextbook> {
    const codeUpper = data.code?.trim().toUpperCase();
    if (!codeUpper) {
      throw new AppError('Mã giáo trình là bắt buộc', HTTP_STATUS.BAD_REQUEST);
    }

    const existing = await Textbook.findOne({ code: codeUpper });
    if (existing) {
      throw new AppError(`Mã giáo trình '${codeUpper}' đã tồn tại trên hệ thống`, HTTP_STATUS.CONFLICT);
    }

    const formattedSize = data.fileSize ? this.formatBytes(data.fileSize) : data.fileSizeFormatted || '0 KB';

    const textbook = await Textbook.create({
      ...data,
      code: codeUpper,
      fileSizeFormatted: formattedSize,
    });

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'CREATE',
        targetCollection: 'textbooks',
        targetId: textbook._id,
        description: `Tạo tài liệu / giáo trình mới: ${textbook.name} (Mã: ${textbook.code})`,
        newData: textbook.toObject(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return textbook;
  }

  static async updateTextbook(id: string, data: Partial<ITextbook>, context?: UserAuditContext): Promise<ITextbook> {
    const existing = await Textbook.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy giáo trình để cập nhật', HTTP_STATUS.NOT_FOUND);
    }
    const oldSnapshot = existing.toObject();

    if (data.code) {
      const codeUpper = data.code.trim().toUpperCase();
      const duplicate = await Textbook.findOne({ code: codeUpper, _id: { $ne: id } });
      if (duplicate) {
        throw new AppError(`Mã giáo trình '${codeUpper}' đã được sử dụng`, HTTP_STATUS.CONFLICT);
      }
      data.code = codeUpper;
    }

    if (data.fileSize) {
      data.fileSizeFormatted = this.formatBytes(data.fileSize);
    }

    const updated = await Textbook.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) {
      throw new AppError('Không tìm thấy giáo trình để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    if (context) {
      const newSnapshot = updated.toObject();
      const changedFields = computeDiff(oldSnapshot, newSnapshot, TEXTBOOK_FIELD_LABELS);
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'UPDATE',
        targetCollection: 'textbooks',
        targetId: updated._id,
        description: `Cập nhật giáo trình: ${updated.name} (Mã: ${updated.code})`,
        changedFields,
        oldData: oldSnapshot,
        newData: newSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return updated;
  }

  static async deleteTextbook(id: string, context?: UserAuditContext): Promise<void> {
    const courseCount = await Course.countDocuments({ textbookId: id });
    if (courseCount > 0) {
      throw new AppError(
        `Không thể xóa giáo trình này vì đang có ${courseCount} khóa học liên kết sử dụng. Vui lòng đổi giáo trình cho các khóa học liên quan trước.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const existing = await Textbook.findById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy giáo trình để xóa', HTTP_STATUS.NOT_FOUND);
    }
    const oldSnapshot = existing.toObject();

    await Textbook.findByIdAndDelete(id);

    if (context) {
      await AuditLogService.recordLog({
        userId: context.userId,
        action: 'DELETE',
        targetCollection: 'textbooks',
        targetId: existing._id,
        description: `Xóa giáo trình: ${existing.name} (Mã: ${existing.code})`,
        oldData: oldSnapshot,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }
  }
}

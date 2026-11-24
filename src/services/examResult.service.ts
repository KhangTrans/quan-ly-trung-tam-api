import mongoose from 'mongoose';
import { ExamResult, IExamResult } from '../models/examResult.model';
import { Student } from '../models/student.model';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

const EXAM_RESULT_FIELD_LABELS: Record<string, string> = {
  scores: 'Điểm số chi tiết',
  'scores.vocabularyKanji': 'Điểm Từ vựng - Chữ Hán (Moji/Goi)',
  'scores.grammarReading': 'Điểm Ngữ pháp - Đọc hiểu (Bunpou/Dokkai)',
  'scores.listening': 'Điểm Nghe hiểu (Choukai)',
  'scores.total': 'Tổng điểm kỳ thi',
  isPassed: 'Kết quả Đạt / Chưa đạt',
  teacherEvaluation: 'Nhận xét & đánh giá của giáo viên',
};

export class ExamResultService {
  static async getAllExamResults(query: { studentId?: string; examId?: string; classId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.studentId) filter.studentId = new mongoose.Types.ObjectId(query.studentId);
    if (query.examId) filter.examId = new mongoose.Types.ObjectId(query.examId);
    if (query.classId) filter.classId = new mongoose.Types.ObjectId(query.classId);

    const [results, total] = await Promise.all([
      ExamResult.find(filter)
        .populate('studentId', 'fullName studentCode phone')
        .populate('examId', 'title examType maxScore passScore')
        .populate('classId', 'name classCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExamResult.countDocuments(filter),
    ]);

    return {
      examResults: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getExamResultById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã kết quả điểm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }
    const result = await ExamResult.findById(id)
      .populate('studentId', 'fullName studentCode phone email')
      .populate('examId', 'title examType maxScore passScore')
      .populate('classId', 'name classCode')
      .lean();
    if (!result) {
      throw new AppError('Không tìm thấy bản ghi điểm số', HTTP_STATUS.NOT_FOUND);
    }
    return result;
  }

  static async createExamResult(data: Partial<IExamResult>, context: UserAuditContext) {
    if (data.scores) {
      const vocab = Number(data.scores.vocabularyKanji) || 0;
      const gram = Number(data.scores.grammarReading) || 0;
      const listen = Number(data.scores.listening) || 0;
      data.scores.total = vocab + gram + listen;
    }

    const created = await ExamResult.create(data);
    const populated = await ExamResult.findById(created._id)
      .populate('studentId', 'fullName studentCode')
      .populate('examId', 'title');

    const studentInfo = populated?.studentId as any;
    const examInfo = populated?.examId as any;

    // Record Audit Log: CREATE
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'CREATE',
      targetCollection: 'exam_results',
      targetId: created._id,
      description: `Nhập điểm thi bài ${examInfo?.title || 'Kỳ thi'} cho học viên ${studentInfo?.fullName || 'N/A'} (Tổng: ${created.scores?.total || 0} điểm)`,
      newData: created.toObject(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return created;
  }

  static async updateExamResult(id: string, updateData: Partial<IExamResult>, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã kết quả điểm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingResult = await ExamResult.findById(id)
      .populate('studentId', 'fullName studentCode')
      .populate('examId', 'title');

    if (!existingResult) {
      throw new AppError('Không tìm thấy bản ghi điểm số để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingResult.toObject();

    if (updateData.scores) {
      const vocab = updateData.scores.vocabularyKanji !== undefined ? Number(updateData.scores.vocabularyKanji) : existingResult.scores.vocabularyKanji;
      const gram = updateData.scores.grammarReading !== undefined ? Number(updateData.scores.grammarReading) : existingResult.scores.grammarReading;
      const listen = updateData.scores.listening !== undefined ? Number(updateData.scores.listening) : existingResult.scores.listening;
      updateData.scores.total = vocab + gram + listen;
    }

    Object.assign(existingResult, updateData);
    const updated = await existingResult.save();
    const newSnapshot = updated.toObject();

    const changedFields = computeDiff(oldSnapshot, newSnapshot, EXAM_RESULT_FIELD_LABELS);
    const studentInfo = existingResult.studentId as any;
    const examInfo = existingResult.examId as any;

    // Record Audit Log: UPDATE (Quan trọng: Lưu vết chỉnh sửa điểm số học viên)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'UPDATE',
      targetCollection: 'exam_results',
      targetId: updated._id,
      description: `Chỉnh sửa điểm số bài ${examInfo?.title || 'Kỳ thi'} của học viên ${studentInfo?.fullName || 'N/A'} (Tổng điểm mới: ${updated.scores?.total || 0})`,
      changedFields,
      oldData: oldSnapshot,
      newData: newSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updated;
  }

  static async deleteExamResult(id: string, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã kết quả điểm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingResult = await ExamResult.findById(id)
      .populate('studentId', 'fullName studentCode')
      .populate('examId', 'title');

    if (!existingResult) {
      throw new AppError('Không tìm thấy điểm số để xóa', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingResult.toObject();
    await ExamResult.findByIdAndDelete(id);

    const studentInfo = existingResult.studentId as any;
    const examInfo = existingResult.examId as any;

    // Record Audit Log: DELETE (Quan trọng: Lưu vết xóa điểm số)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'DELETE',
      targetCollection: 'exam_results',
      targetId: new mongoose.Types.ObjectId(id),
      description: `Xóa kết quả điểm bài thi ${examInfo?.title || 'Kỳ thi'} của học viên ${studentInfo?.fullName || 'N/A'}`,
      oldData: oldSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { message: 'Đã xóa kết quả điểm và lưu lịch sử kiểm toán thành công', result: oldSnapshot };
  }
}

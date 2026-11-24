import mongoose from 'mongoose';
import { AuditLog, IAuditLog, AuditAction, IChangedField } from '../models/auditLog.model';
import { User } from '../models/user.model';

export interface RecordAuditLogParams {
  userId: string | mongoose.Types.ObjectId;
  action: AuditAction;
  targetCollection: string;
  targetId: string | mongoose.Types.ObjectId;
  description?: string;
  changedFields?: IChangedField[];
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface QueryAuditLogParams {
  page?: number;
  limit?: number;
  targetCollection?: string;
  action?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class AuditLogService {
  /**
   * Asynchronously record an audit log without blocking main operations
   */
  static async recordLog(params: RecordAuditLogParams): Promise<IAuditLog | null> {
    try {
      if (!params.userId) {
        // Find a fallback admin user if action was triggered without explicit user in test scripts
        const defaultAdmin = await User.findOne({ role: 'admin' }).select('_id');
        if (defaultAdmin) {
          params.userId = defaultAdmin._id;
        } else {
          console.warn('[AuditLog] Bỏ qua ghi nhật ký: Thiếu userId');
          return null;
        }
      }

      // Snapshot user identity so who performed the action is permanently and immutably preserved
      let userSnapshot = undefined;
      const userDoc = await User.findById(params.userId).select('name email role avatar phone').lean();
      if (userDoc) {
        userSnapshot = {
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role,
          avatar: userDoc.avatar,
          phone: userDoc.phone,
        };
      }

      const log = await AuditLog.create({
        userId: new mongoose.Types.ObjectId(params.userId.toString()),
        userSnapshot,
        action: params.action,
        targetCollection: params.targetCollection,
        targetId: new mongoose.Types.ObjectId(params.targetId.toString()),
        description: params.description,
        changedFields: params.changedFields,
        oldData: params.oldData,
        newData: params.newData,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'Web Browser',
      });

      return log;
    } catch (error) {
      console.error('[AuditLog] Lỗi khi lưu nhật ký hệ thống:', error);
      return null;
    }
  }

  /**
   * Query audit logs with pagination and filters
   */
  static async getAuditLogs(params: QueryAuditLogParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.targetCollection && params.targetCollection !== 'all') {
      filter.targetCollection = params.targetCollection;
    }

    if (params.action && params.action !== 'all') {
      filter.action = params.action;
    }

    if (params.userId) {
      filter.userId = new mongoose.Types.ObjectId(params.userId);
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      filter.$or = [
        { description: searchRegex },
        { targetCollection: searchRegex },
        { ipAddress: searchRegex },
      ];
    }

    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) {
        filter.createdAt.$gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [rawLogs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'name email role avatar phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    // Ensure the identity of WHO performed the action is always present
    const logs = rawLogs.map((log: any) => {
      const user = log.userId || log.userSnapshot || {
        name: 'Quản trị viên',
        email: 'admin@minhtucenter.com',
        role: 'admin',
      };
      return {
        ...log,
        userId: user,
      };
    });

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detail of a specific audit log
   */
  static async getAuditLogById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const log: any = await AuditLog.findById(id)
      .populate('userId', 'name email role avatar phone')
      .lean();

    if (!log) return null;

    if (!log.userId && log.userSnapshot) {
      log.userId = log.userSnapshot;
    }

    return log;
  }

  /**
   * Get aggregate statistics for dashboard
   */
  static async getAuditLogStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, byCollection, byAction] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      AuditLog.aggregate([
        { $group: { _id: '$targetCollection', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalLogs,
      todayLogs,
      byCollection: byCollection.reduce((acc: any, cur: any) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
      byAction: byAction.reduce((acc: any, cur: any) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Seed realistic sample audit logs if database has few or none
   */
  static async seedSampleAuditLogsIfEmpty() {
    const count = await AuditLog.countDocuments();
    if (count >= 5) return;

    const admin = await User.findOne({ role: 'admin' });
    const staff = await User.findOne({ role: 'staff' });
    const teacher = await User.findOne({ role: 'teacher' });

    const adminId = admin?._id || new mongoose.Types.ObjectId();
    const staffId = staff?._id || adminId;
    const teacherId = teacher?._id || adminId;

    const adminSnapshot = {
      name: admin?.name || 'Ban Giám Đốc Minh Tú',
      email: admin?.email || 'admin@minhtucenter.com',
      role: 'admin',
    };
    const staffSnapshot = {
      name: staff?.name || 'Nguyễn Thị Thu (Giáo vụ)',
      email: staff?.email || 'giaovu@minhtucenter.com',
      role: 'staff',
    };
    const teacherSnapshot = {
      name: teacher?.name || 'Sensei Trần Thị Mai (N2)',
      email: teacher?.email || 'tranmai@minhtucenter.com',
      role: 'teacher',
    };

    const sampleLogs = [
      {
        userId: adminId,
        userSnapshot: adminSnapshot,
        action: 'UPDATE' as AuditAction,
        targetCollection: 'students',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Chỉnh sửa thông tin liên hệ và số điện thoại học viên Nguyễn Văn Hoàng (MT-HV-26001)',
        changedFields: [
          {
            field: 'phone',
            fieldName: 'Số điện thoại',
            oldValue: '0939111222',
            newValue: '0939888999',
          },
          {
            field: 'address',
            fieldName: 'Địa chỉ',
            oldValue: 'Ninh Kiều, Cần Thơ',
            newValue: 'Số 123 Đường 30/4, Ninh Kiều, Cần Thơ',
          },
        ],
        oldData: {
          studentCode: 'MT-HV-26001',
          fullName: 'Nguyễn Văn Hoàng',
          phone: '0939111222',
          address: 'Ninh Kiều, Cần Thơ',
          status: 'active',
        },
        newData: {
          studentCode: 'MT-HV-26001',
          fullName: 'Nguyễn Văn Hoàng',
          phone: '0939888999',
          address: 'Số 123 Đường 30/4, Ninh Kiều, Cần Thơ',
          status: 'active',
        },
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
      },
      {
        userId: staffId,
        userSnapshot: staffSnapshot,
        action: 'UPDATE' as AuditAction,
        targetCollection: 'invoices',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Cập nhật số tiền thanh toán phiếu thu học phí PT-2601-002 cho học viên Lê Thị Mỹ Linh',
        changedFields: [
          {
            field: 'paidAmount',
            fieldName: 'Số tiền đã đóng',
            oldValue: 1000000,
            newValue: 3500000,
          },
          {
            field: 'debtAmount',
            fieldName: 'Số tiền còn nợ',
            oldValue: 2500000,
            newValue: 0,
          },
          {
            field: 'status',
            fieldName: 'Trạng thái phiếu thu',
            oldValue: 'partially_paid',
            newValue: 'paid',
          },
        ],
        oldData: {
          invoiceCode: 'PT-2601-002',
          studentName: 'Lê Thị Mỹ Linh',
          originalAmount: 3500000,
          paidAmount: 1000000,
          debtAmount: 2500000,
          status: 'partially_paid',
        },
        newData: {
          invoiceCode: 'PT-2601-002',
          studentName: 'Lê Thị Mỹ Linh',
          originalAmount: 3500000,
          paidAmount: 3500000,
          debtAmount: 0,
          status: 'paid',
        },
        ipAddress: '192.168.1.18',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      },
      {
        userId: teacherId,
        userSnapshot: teacherSnapshot,
        action: 'UPDATE' as AuditAction,
        targetCollection: 'exam_results',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Chỉnh sửa điểm thi định kỳ JLPT N5 của học viên Nguyễn Văn Hoàng (Phúc khảo nghe hiểu)',
        changedFields: [
          {
            field: 'scores.listening',
            fieldName: 'Điểm Nghe hiểu (Choukai)',
            oldValue: 38,
            newValue: 46,
          },
          {
            field: 'scores.total',
            fieldName: 'Tổng điểm',
            oldValue: 112,
            newValue: 120,
          },
          {
            field: 'teacherEvaluation',
            fieldName: 'Nhận xét của giáo viên',
            oldValue: 'Cần luyện thêm phản xạ nghe câu ngắn',
            newValue: 'Đã phúc khảo lại câu 5 bài nghe, đạt chuẩn khá',
          },
        ],
        oldData: {
          studentCode: 'MT-HV-26001',
          studentName: 'Nguyễn Văn Hoàng',
          examName: 'Thi thử JLPT N5 Đợt 1',
          scores: { vocabularyKanji: 42, grammarReading: 32, listening: 38, total: 112 },
          isPassed: true,
        },
        newData: {
          studentCode: 'MT-HV-26001',
          studentName: 'Nguyễn Văn Hoàng',
          examName: 'Thi thử JLPT N5 Đợt 1',
          scores: { vocabularyKanji: 42, grammarReading: 32, listening: 46, total: 120 },
          isPassed: true,
        },
        ipAddress: '14.238.10.92',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/126.0.0.0',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000), // 5 hours ago
      },
      {
        userId: adminId,
        userSnapshot: adminSnapshot,
        action: 'DELETE' as AuditAction,
        targetCollection: 'students',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Xóa hồ sơ học viên hủy học trước ngày khai giảng: Trần Văn Đạt (Mã: MT-HV-25990)',
        oldData: {
          studentCode: 'MT-HV-25990',
          fullName: 'Trần Văn Đạt',
          phone: '0918765432',
          email: 'dat.tran@example.com',
          status: 'dropped',
          notes: 'Học viên chuyển công tác ra Hà Nội nên hủy đăng ký trước khai giảng',
        },
        ipAddress: '192.168.1.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
      },
      {
        userId: staffId,
        userSnapshot: staffSnapshot,
        action: 'CANCEL' as AuditAction,
        targetCollection: 'invoices',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Hủy phiếu thu nhầm lẫn số tiền: PT-2601-008 (Số tiền: 5,500,000 VND)',
        changedFields: [
          {
            field: 'status',
            fieldName: 'Trạng thái phiếu thu',
            oldValue: 'unpaid',
            newValue: 'cancelled',
          },
          {
            field: 'notes',
            fieldName: 'Lý do hủy',
            oldValue: '',
            newValue: 'Tạo trùng hóa đơn cho học viên đăng ký chuyển lớp',
          },
        ],
        oldData: {
          invoiceCode: 'PT-2601-008',
          studentName: 'Đặng Minh Tâm',
          finalAmount: 5500000,
          status: 'unpaid',
        },
        newData: {
          invoiceCode: 'PT-2601-008',
          studentName: 'Đặng Minh Tâm',
          finalAmount: 5500000,
          status: 'cancelled',
          notes: 'Tạo trùng hóa đơn cho học viên đăng ký chuyển lớp',
        },
        ipAddress: '192.168.1.18',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000), // 1.5 days ago
      },
      {
        userId: teacherId,
        userSnapshot: teacherSnapshot,
        action: 'DELETE' as AuditAction,
        targetCollection: 'exam_results',
        targetId: new mongoose.Types.ObjectId(),
        description: 'Xóa kết quả điểm thi nhập sai lớp của học viên Hoàng Gia Huy trong đợt thi Mini-Test Kanji',
        oldData: {
          studentCode: 'MT-HV-26005',
          studentName: 'Hoàng Gia Huy',
          examName: 'Mini-Test Kanji Tuần 2',
          scores: { vocabularyKanji: 15, grammarReading: 0, listening: 0, total: 15 },
          notes: 'Nhập nhầm vào lớp N4 thay vì lớp N5',
        },
        ipAddress: '14.238.10.92',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/126.0.0.0',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
      },
    ];

    await AuditLog.insertMany(sampleLogs);
    console.log(`[AuditLog] Đã tạo thành công ${sampleLogs.length} bản ghi nhật ký kiểm toán mẫu.`);
  }
}

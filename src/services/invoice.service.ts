import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../models/invoice.model';
import { Student } from '../models/student.model';
import { AuditLogService } from './auditLog.service';
import { computeDiff, UserAuditContext } from '../utils/auditHelper';
import { AppError } from '../utils/appError';
import { HTTP_STATUS } from '../constants/httpStatus';

const INVOICE_FIELD_LABELS: Record<string, string> = {
  title: 'Nội dung phiếu thu',
  originalAmount: 'Số tiền gốc',
  discountAmount: 'Giảm giá / Ưu đãi',
  finalAmount: 'Tổng tiền phải nộp',
  paidAmount: 'Số tiền đã thanh toán',
  debtAmount: 'Số tiền còn nợ',
  status: 'Trạng thái phiếu thu',
  dueDate: 'Hạn chót thanh toán',
  notes: 'Ghi chú phiếu thu',
};

export class InvoiceService {
  static async getAllInvoices(query: { search?: string; status?: string; studentId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }
    if (query.studentId) {
      filter.studentId = new mongoose.Types.ObjectId(query.studentId);
    }
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { invoiceCode: regex },
        { title: regex },
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('studentId', 'fullName studentCode phone email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getInvoiceById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã phiếu thu không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }
    const invoice = await Invoice.findById(id)
      .populate('studentId', 'fullName studentCode phone email')
      .lean();
    if (!invoice) {
      throw new AppError('Không tìm thấy phiếu thu', HTTP_STATUS.NOT_FOUND);
    }
    return invoice;
  }

  static async createInvoice(data: Partial<IInvoice>, context: UserAuditContext) {
    if (!data.invoiceCode) {
      const count = await Invoice.countDocuments();
      data.invoiceCode = `PT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    // Calculate amounts
    const original = Number(data.originalAmount) || 0;
    const discount = Number(data.discountAmount) || 0;
    const finalAmount = Math.max(0, original - discount);
    const paid = Number(data.paidAmount) || 0;
    const debt = Math.max(0, finalAmount - paid);

    data.finalAmount = finalAmount;
    data.debtAmount = debt;

    const invoice = await Invoice.create(data);
    const populated = await Invoice.findById(invoice._id).populate('studentId', 'fullName studentCode');

    // Record Audit Log: CREATE
    const studentInfo = populated?.studentId as any;
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'CREATE',
      targetCollection: 'invoices',
      targetId: invoice._id,
      description: `Lập phiếu thu mới ${invoice.invoiceCode} cho học viên ${studentInfo?.fullName || 'N/A'} (Số tiền: ${finalAmount.toLocaleString('vi-VN')} VND)`,
      newData: invoice.toObject(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return invoice;
  }

  static async updateInvoice(id: string, updateData: Partial<IInvoice>, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã phiếu thu không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingInvoice = await Invoice.findById(id).populate('studentId', 'fullName studentCode');
    if (!existingInvoice) {
      throw new AppError('Không tìm thấy phiếu thu để cập nhật', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingInvoice.toObject();

    // Recalculate debt if paidAmount or originalAmount changed
    if (updateData.originalAmount !== undefined || updateData.discountAmount !== undefined || updateData.paidAmount !== undefined) {
      const original = updateData.originalAmount !== undefined ? Number(updateData.originalAmount) : existingInvoice.originalAmount;
      const discount = updateData.discountAmount !== undefined ? Number(updateData.discountAmount) : existingInvoice.discountAmount;
      const finalAmount = Math.max(0, original - discount);
      const paid = updateData.paidAmount !== undefined ? Number(updateData.paidAmount) : existingInvoice.paidAmount;
      const debt = Math.max(0, finalAmount - paid);

      updateData.finalAmount = finalAmount;
      updateData.debtAmount = debt;

      if (paid >= finalAmount) {
        updateData.status = 'paid';
      } else if (paid > 0) {
        updateData.status = 'partially_paid';
      }
    }

    Object.assign(existingInvoice, updateData);
    const updatedInvoice = await existingInvoice.save();
    const newSnapshot = updatedInvoice.toObject();

    const changedFields = computeDiff(oldSnapshot, newSnapshot, INVOICE_FIELD_LABELS);
    const studentInfo = existingInvoice.studentId as any;

    // Record Audit Log: UPDATE (Quan trọng: Lưu vết chỉnh sửa phiếu thu)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'UPDATE',
      targetCollection: 'invoices',
      targetId: updatedInvoice._id,
      description: `Chỉnh sửa thông tin phiếu thu ${updatedInvoice.invoiceCode} (Học viên: ${studentInfo?.fullName || 'N/A'}) - Cập nhật ${changedFields.length} mục`,
      changedFields,
      oldData: oldSnapshot,
      newData: newSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updatedInvoice;
  }

  static async cancelInvoice(id: string, reason: string, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã phiếu thu không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingInvoice = await Invoice.findById(id).populate('studentId', 'fullName studentCode');
    if (!existingInvoice) {
      throw new AppError('Không tìm thấy phiếu thu để hủy', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingInvoice.toObject();
    existingInvoice.status = 'cancelled';
    existingInvoice.notes = reason ? `${existingInvoice.notes || ''} [Lý do hủy: ${reason}]`.trim() : existingInvoice.notes;
    const updatedInvoice = await existingInvoice.save();
    const newSnapshot = updatedInvoice.toObject();

    const changedFields = computeDiff(oldSnapshot, newSnapshot, INVOICE_FIELD_LABELS);
    const studentInfo = existingInvoice.studentId as any;

    // Record Audit Log: CANCEL (Quan trọng: Lưu vết hủy giao dịch/phiếu thu)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'CANCEL',
      targetCollection: 'invoices',
      targetId: updatedInvoice._id,
      description: `Hủy phiếu thu ${updatedInvoice.invoiceCode} của học viên ${studentInfo?.fullName || 'N/A'} (Lý do: ${reason || 'Không nêu'})`,
      changedFields,
      oldData: oldSnapshot,
      newData: newSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return updatedInvoice;
  }

  static async deleteInvoice(id: string, context: UserAuditContext) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Mã phiếu thu không hợp lệ', HTTP_STATUS.BAD_REQUEST);
    }

    const existingInvoice = await Invoice.findById(id).populate('studentId', 'fullName studentCode');
    if (!existingInvoice) {
      throw new AppError('Không tìm thấy phiếu thu để xóa', HTTP_STATUS.NOT_FOUND);
    }

    const oldSnapshot = existingInvoice.toObject();
    await Invoice.findByIdAndDelete(id);
    const studentInfo = existingInvoice.studentId as any;

    // Record Audit Log: DELETE (Quan trọng: Lưu vết xóa phiếu thu)
    await AuditLogService.recordLog({
      userId: context.userId,
      action: 'DELETE',
      targetCollection: 'invoices',
      targetId: new mongoose.Types.ObjectId(id),
      description: `Xóa bỏ hoàn toàn phiếu thu ${existingInvoice.invoiceCode} của học viên ${studentInfo?.fullName || 'N/A'} (Số tiền: ${existingInvoice.finalAmount?.toLocaleString('vi-VN')} VND)`,
      oldData: oldSnapshot,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { message: 'Đã xóa phiếu thu và lưu lịch sử kiểm toán thành công', invoice: oldSnapshot };
  }
}

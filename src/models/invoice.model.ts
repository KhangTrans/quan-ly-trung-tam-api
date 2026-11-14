import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface IInvoice extends Document {
  invoiceCode: string;
  studentId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;
  title: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  debtAmount: number;
  dueDate: Date;
  status: InvoiceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceCode: {
      type: String,
      required: [true, 'Mã hóa đơn là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    title: {
      type: String,
      required: [true, 'Nội dung hóa đơn là bắt buộc'],
      trim: true,
    },
    originalAmount: {
      type: Number,
      required: [true, 'Số tiền gốc là bắt buộc'],
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    debtAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Hạn đóng học phí là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'unpaid',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ studentId: 1 });
invoiceSchema.index({ status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);

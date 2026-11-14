import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'VIETQR' | 'BANK_TRANSFER' | 'CASH' | 'MOMO';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface IPaymentTransaction extends Document {
  invoiceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  transactionCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentGateway: 'PAYOS' | 'MANUAL';
  qrCodeUrl?: string;
  status: TransactionStatus;
  bankTransactionId?: string;
  paidAt?: Date;
  note?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Hóa đơn là bắt buộc'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    transactionCode: {
      type: String,
      required: [true, 'Mã giao dịch là bắt buộc'],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền giao dịch là bắt buộc'],
      min: [1000, 'Số tiền tối thiểu 1,000 VNĐ'],
    },
    paymentMethod: {
      type: String,
      enum: ['VIETQR', 'BANK_TRANSFER', 'CASH', 'MOMO'],
      default: 'VIETQR',
    },
    paymentGateway: {
      type: String,
      enum: ['PAYOS', 'MANUAL'],
      default: 'PAYOS',
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    bankTransactionId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({ invoiceId: 1 });
paymentTransactionSchema.index({ status: 1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  paymentTransactionSchema
);

import mongoose, { Document, Schema } from 'mongoose';

export type TransferType = 'RESERVATION' | 'CLASS_TRANSFER' | 'MAKEUP_CLASS';

export interface IClassTransfer extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: TransferType;
  fromClassId: mongoose.Types.ObjectId;
  toClassId?: mongoose.Types.ObjectId;
  targetScheduleId?: mongoose.Types.ObjectId;
  remainingSessionsAtEvent: number;
  reservationExpiryDate?: Date;
  reason: string;
  approvedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const classTransferSchema = new Schema<IClassTransfer>(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    type: {
      type: String,
      enum: ['RESERVATION', 'CLASS_TRANSFER', 'MAKEUP_CLASS'],
      required: true,
    },
    fromClassId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    toClassId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    targetScheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
    },
    remainingSessionsAtEvent: {
      type: Number,
      required: true,
      default: 0,
    },
    reservationExpiryDate: {
      type: Date,
    },
    reason: {
      type: String,
      required: [true, 'Lý do là bắt buộc'],
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClassTransfer = mongoose.model<IClassTransfer>('ClassTransfer', classTransferSchema);

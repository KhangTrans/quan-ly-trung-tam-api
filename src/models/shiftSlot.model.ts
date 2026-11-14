import mongoose, { Document, Schema } from 'mongoose';

export type ShiftPeriod = 'morning' | 'afternoon' | 'evening';

export interface IShiftSlot extends Document {
  name: string;
  startTime: string;
  endTime: string;
  period: ShiftPeriod;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSlotSchema = new Schema<IShiftSlot>(
  {
    name: {
      type: String,
      required: [true, 'Tên ca học là bắt buộc'],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc (VD: 18:00)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc (VD: 19:30)'],
      trim: true,
    },
    period: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true,
      default: 'evening',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ShiftSlot = mongoose.model<IShiftSlot>('ShiftSlot', shiftSlotSchema);

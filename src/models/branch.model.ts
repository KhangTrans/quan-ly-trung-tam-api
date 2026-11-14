import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: [true, 'Tên chi nhánh là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã chi nhánh là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại liên hệ là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);

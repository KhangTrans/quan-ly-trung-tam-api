import mongoose, { Document, Schema } from 'mongoose';

export type StudentStatus = 'active' | 'graduated' | 'paused' | 'dropped';

export interface IStudent extends Document {
  studentCode: string;
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  dob?: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  parentContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  inputLevel: string;
  learningObjective: string;
  status: StudentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    studentCode: {
      type: String,
      required: [true, 'Mã học viên là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fullName: {
      type: String,
      required: [true, 'Họ và tên học viên là bắt buộc'],
      trim: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    parentContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    inputLevel: {
      type: String,
      default: 'Chưa biết gì',
    },
    learningObjective: {
      type: String,
      default: 'Giao tiếp & Luyện thi',
    },
    status: {
      type: String,
      enum: ['active', 'graduated', 'paused', 'dropped'],
      default: 'active',
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

studentSchema.index({ phone: 1 });
studentSchema.index({ status: 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);

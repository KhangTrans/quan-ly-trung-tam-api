import mongoose, { Document, Schema } from 'mongoose';

export interface ITextbook extends Document {
  name: string;
  code: string;
  level: string;
  author?: string;
  publisher?: string;
  totalLessons?: number;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const textbookSchema = new Schema<ITextbook>(
  {
    name: {
      type: String,
      required: [true, 'Tên giáo trình là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã giáo trình là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    level: {
      type: String,
      required: [true, 'Cấp độ áp dụng là bắt buộc'],
      default: 'Tất cả',
    },
    author: {
      type: String,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    totalLessons: {
      type: Number,
      default: 25,
      min: 1,
    },
    fileUrl: {
      type: String,
      required: [true, 'Đường dẫn file PDF giáo trình là bắt buộc'],
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    fileSizeFormatted: {
      type: String,
      default: '0 KB',
    },
    description: {
      type: String,
      trim: true,
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

export const Textbook = mongoose.model<ITextbook>('Textbook', textbookSchema);

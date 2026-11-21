import mongoose, { Document, Schema } from 'mongoose';

export type JapaneseLevel =
  | 'N5'
  | 'N4'
  | 'N3'
  | 'N2'
  | 'N1'
  | 'Kaiwa'
  | 'Luyện thi JLPT'
  | 'Luyện thi NAT-TEST'
  | 'JLPT'
  | 'NAT-TEST';
export type CourseStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface ICourse extends Document {
  title: string;
  code: string;
  level: JapaneseLevel;
  description?: string;
  textbook: string;
  totalSessions: number;
  tuitionFee: number;
  duration?: string;
  schedule?: string;
  maxStudents: number;
  startDate?: Date;
  status: CourseStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Tên khóa học là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã khóa học là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    level: {
      type: String,
      enum: [
        'N5',
        'N4',
        'N3',
        'N2',
        'N1',
        'Kaiwa',
        'Luyện thi JLPT',
        'Luyện thi NAT-TEST',
        'JLPT',
        'NAT-TEST',
      ],
      required: [true, 'Trình độ tiếng Nhật là bắt buộc'],
    },
    description: {
      type: String,
      trim: true,
    },
    textbook: {
      type: String,
      default: 'Minna no Nihongo I',
      trim: true,
    },
    totalSessions: {
      type: Number,
      required: [true, 'Tổng số buổi học là bắt buộc'],
      default: 45,
      min: 1,
    },
    tuitionFee: {
      type: Number,
      required: [true, 'Học phí là bắt buộc'],
      min: [0, 'Học phí không thể âm'],
    },
    duration: {
      type: String,
      default: '3 tháng',
    },
    schedule: {
      type: String,
      trim: true,
    },
    maxStudents: {
      type: Number,
      default: 20,
    },
    startDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
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

export const Course = mongoose.model<ICourse>('Course', courseSchema);

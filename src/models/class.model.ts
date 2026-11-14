import mongoose, { Document, Schema } from 'mongoose';

export type ClassStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface IClass extends Document {
  courseId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  classCode: string;
  name: string;
  primaryTeacherId: mongoose.Types.ObjectId;
  defaultClassroomId: mongoose.Types.ObjectId;
  daysOfWeek: number[]; // 2, 4, 6 hoặc 3, 5, 7 (2 = Thứ Hai, ..., 8 = Chủ Nhật)
  shiftSlotId: mongoose.Types.ObjectId;
  startDate: Date;
  endDateExpected?: Date;
  maxStudents: number;
  currentStudentCount: number;
  status: ClassStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Khóa học là bắt buộc'],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh là bắt buộc'],
    },
    classCode: {
      type: String,
      required: [true, 'Mã lớp học là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Tên lớp học là bắt buộc'],
      trim: true,
    },
    primaryTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giáo viên phụ trách là bắt buộc'],
    },
    defaultClassroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Phòng học là bắt buộc'],
    },
    daysOfWeek: {
      type: [Number],
      required: [true, 'Các ngày học trong tuần là bắt buộc'],
      validate: {
        validator: (arr: number[]) => arr.length > 0 && arr.every((d) => d >= 2 && d <= 8),
        message: 'Ngày học trong tuần phải từ Thứ 2 (2) đến Chủ Nhật (8)',
      },
    },
    shiftSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftSlot',
      required: [true, 'Ca học là bắt buộc'],
    },
    startDate: {
      type: Date,
      required: [true, 'Ngày khai giảng là bắt buộc'],
    },
    endDateExpected: {
      type: Date,
    },
    maxStudents: {
      type: Number,
      default: 20,
    },
    currentStudentCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
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

export const Class = mongoose.model<IClass>('Class', classSchema);

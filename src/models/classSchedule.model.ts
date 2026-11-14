import mongoose, { Document, Schema } from 'mongoose';

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

export interface IClassSchedule extends Document {
  classId: mongoose.Types.ObjectId;
  sessionNumber: number;
  date: Date;
  shiftSlotId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  status: ScheduleStatus;
  isHolidaySubstitute: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classScheduleSchema = new Schema<IClassSchedule>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    sessionNumber: {
      type: Number,
      required: [true, 'Số thứ tự buổi học là bắt buộc'],
    },
    date: {
      type: Date,
      required: [true, 'Ngày học là bắt buộc'],
    },
    shiftSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftSlot',
      required: [true, 'Ca học là bắt buộc'],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giáo viên là bắt buộc'],
    },
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Phòng học là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    isHolidaySubstitute: {
      type: Boolean,
      default: false,
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

// Indexes phục vụ phát hiện trùng lịch (Conflict Detection)
classScheduleSchema.index({ teacherId: 1, date: 1, shiftSlotId: 1 });
classScheduleSchema.index({ classroomId: 1, date: 1, shiftSlotId: 1 });
classScheduleSchema.index({ classId: 1, date: 1 });

export const ClassSchedule = mongoose.model<IClassSchedule>('ClassSchedule', classScheduleSchema);

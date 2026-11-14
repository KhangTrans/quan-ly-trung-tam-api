import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'excused_absence' | 'unexcused_absence' | 'late';

export interface IAttendance extends Document {
  scheduleId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  note?: string;
  markedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      required: [true, 'Buổi học là bắt buộc'],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['present', 'excused_absence', 'unexcused_absence', 'late'],
      default: 'present',
    },
    note: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ scheduleId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, classId: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

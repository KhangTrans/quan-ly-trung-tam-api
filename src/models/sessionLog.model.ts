import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentSessionComment {
  studentId: mongoose.Types.ObjectId;
  comment: string;
}

export interface ISessionLog extends Document {
  scheduleId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  lessonContent: string;
  homework: string;
  classAtmosphere?: string;
  studentComments: IStudentSessionComment[];
  createdAt: Date;
  updatedAt: Date;
}

const sessionLogSchema = new Schema<ISessionLog>(
  {
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      required: [true, 'Buổi học là bắt buộc'],
      unique: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giáo viên ghi sổ là bắt buộc'],
    },
    lessonContent: {
      type: String,
      required: [true, 'Nội dung bài học là bắt buộc'],
      trim: true,
    },
    homework: {
      type: String,
      required: [true, 'Bài tập về nhà là bắt buộc'],
      trim: true,
    },
    classAtmosphere: {
      type: String,
      trim: true,
    },
    studentComments: [
      {
        studentId: {
          type: Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        comment: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SessionLog = mongoose.model<ISessionLog>('SessionLog', sessionLogSchema);

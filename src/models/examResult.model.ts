import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentScores {
  vocabularyKanji: number;
  grammarReading: number;
  listening: number;
  total: number;
}

export interface IExamResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  scores: IStudentScores;
  isPassed: boolean;
  teacherEvaluation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const examResultSchema = new Schema<IExamResult>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Kỳ thi là bắt buộc'],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Học viên là bắt buộc'],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    scores: {
      vocabularyKanji: { type: Number, default: 0 },
      grammarReading: { type: Number, default: 0 },
      listening: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    teacherEvaluation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1 });

export const ExamResult = mongoose.model<IExamResult>('ExamResult', examResultSchema);

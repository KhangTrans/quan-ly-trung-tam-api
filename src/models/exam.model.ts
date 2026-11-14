import mongoose, { Document, Schema } from 'mongoose';

export type ExamType = 'PERIODIC_TEST' | 'JLPT_MOCK' | 'FINAL_EXAM';

export interface IExamMaxScore {
  vocabularyKanji: number;
  grammarReading: number;
  listening: number;
  total: number;
}

export interface IExam extends Document {
  classId: mongoose.Types.ObjectId;
  title: string;
  examType: ExamType;
  examDate: Date;
  maxScore: IExamMaxScore;
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề kỳ thi là bắt buộc'],
      trim: true,
    },
    examType: {
      type: String,
      enum: ['PERIODIC_TEST', 'JLPT_MOCK', 'FINAL_EXAM'],
      default: 'PERIODIC_TEST',
    },
    examDate: {
      type: Date,
      required: [true, 'Ngày thi là bắt buộc'],
    },
    maxScore: {
      vocabularyKanji: { type: Number, default: 60 },
      grammarReading: { type: Number, default: 60 },
      listening: { type: Number, default: 60 },
      total: { type: Number, default: 180 },
    },
    passingScore: {
      type: Number,
      default: 90,
    },
  },
  {
    timestamps: true,
  }
);

export const Exam = mongoose.model<IExam>('Exam', examSchema);

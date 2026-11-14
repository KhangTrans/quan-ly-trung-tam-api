import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentStatus = 'enrolled' | 'reserved' | 'transferred' | 'dropped';
export type TuitionStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  remainingSessions: number;
  tuitionStatus: TuitionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
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
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['enrolled', 'reserved', 'transferred', 'dropped'],
      default: 'enrolled',
    },
    remainingSessions: {
      type: Number,
      default: 0,
    },
    tuitionStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
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

enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

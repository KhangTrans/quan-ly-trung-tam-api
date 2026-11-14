import mongoose, { Document, Schema } from 'mongoose';

export interface IClassroom extends Document {
  branchId: mongoose.Types.ObjectId;
  roomCode: string;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const classroomSchema = new Schema<IClassroom>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Chi nhánh là bắt buộc'],
    },
    roomCode: {
      type: String,
      required: [true, 'Mã phòng học là bắt buộc'],
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Sức chứa phòng học là bắt buộc'],
      default: 25,
      min: [1, 'Sức chứa tối thiểu 1 người'],
    },
    facilities: {
      type: [String],
      default: ['Bảng từ', 'Máy lạnh', 'Loa nghe'],
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

// Tránh trùng mã phòng trong cùng 1 chi nhánh
classroomSchema.index({ branchId: 1, roomCode: 1 }, { unique: true });

export const Classroom = mongoose.model<IClassroom>('Classroom', classroomSchema);

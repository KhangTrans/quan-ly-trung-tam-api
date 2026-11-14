import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetCollection: string;
  targetId: mongoose.Types.ObjectId;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'CANCEL'],
      required: true,
    },
    targetCollection: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    oldData: {
      type: Schema.Types.Mixed,
    },
    newData: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ targetCollection: 1, targetId: 1 });
auditLogSchema.index({ userId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

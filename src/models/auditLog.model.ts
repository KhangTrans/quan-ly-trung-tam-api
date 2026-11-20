import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL';

export interface IChangedField {
  field: string;
  fieldName?: string;
  oldValue: any;
  newValue: any;
}

export interface IUserSnapshot {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
}

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userSnapshot?: IUserSnapshot;
  action: AuditAction;
  targetCollection: string;
  targetId: mongoose.Types.ObjectId;
  description?: string;
  changedFields?: IChangedField[];
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
    userSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      role: { type: String, trim: true },
      avatar: { type: String },
      phone: { type: String },
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
    description: {
      type: String,
      trim: true,
    },
    changedFields: [
      {
        field: { type: String, required: true },
        fieldName: { type: String },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
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

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetCollection: 1, targetId: 1 });
auditLogSchema.index({ userId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

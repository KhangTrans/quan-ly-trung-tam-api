import { Request } from 'express';
import { IChangedField } from '../models/auditLog.model';

export interface UserAuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export const extractAuditContext = (req: Request & { user?: { userId: string } }): UserAuditContext => {
  const userId = req.user?.userId || '';
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';

  return {
    userId,
    ipAddress,
    userAgent,
  };
};

/**
 * Compare oldData and newData and return array of changed fields
 */
export const computeDiff = (
  oldData: Record<string, any> = {},
  newData: Record<string, any> = {},
  fieldLabels: Record<string, string> = {}
): IChangedField[] => {
  const changed: IChangedField[] = [];
  const ignoredKeys = new Set(['_id', '__v', 'createdAt', 'updatedAt']);

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;

    const oldVal = oldData[key];
    const newVal = newData[key];

    // Check if values are different
    const isDifferent =
      typeof oldVal === 'object' || typeof newVal === 'object'
        ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
        : oldVal !== newVal;

    if (isDifferent && newVal !== undefined) {
      changed.push({
        field: key,
        fieldName: fieldLabels[key] || key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changed;
};

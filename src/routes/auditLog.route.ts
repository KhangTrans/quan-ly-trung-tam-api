import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /audit-logs/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan các thao tác nhật ký hệ thống
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticate, authorize('admin'), AuditLogController.getAuditLogStats);

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Lấy danh sách lịch sử thao tác hệ thống (Audit Logs)
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('admin'), AuditLogController.getAuditLogs);

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Xem chi tiết một bản ghi nhật ký kiểm toán (kèm oldData, newData)
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, authorize('admin'), AuditLogController.getAuditLogById);

export default router;

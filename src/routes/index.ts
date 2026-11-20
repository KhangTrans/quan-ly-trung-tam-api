import { Router } from 'express';
import authRoutes from './auth.route';
import courseRoutes from './course.route';
import enrollmentRoutes from './enrollment.route';
import branchRoutes from './branch.route';
import classroomRoutes from './classroom.route';
import shiftSlotRoutes from './shiftSlot.route';
import classRoutes from './class.route';
import auditLogRoutes from './auditLog.route';
import studentRoutes from './student.route';
import invoiceRoutes from './invoice.route';
import examResultRoutes from './examResult.route';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Kiểm tra trạng thái hoạt động của hệ thống (Health Check)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Máy chủ đang chạy bình thường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Minh Tu Center API is running smoothly 🚀" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime: { type: number, example: 12.34 }
 *                     timestamp: { type: string, example: "2026-11-15T07:25:00.000Z" }
 */
router.get('/health', (_req, res) => {
  ApiResponse.success({
    res,
    message: 'Minh Tu Center API is running smoothly 🚀',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount modular routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/branches', branchRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/shift-slots', shiftSlotRoutes);
router.use('/classes', classRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/students', studentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/exam-results', examResultRoutes);

export default router;

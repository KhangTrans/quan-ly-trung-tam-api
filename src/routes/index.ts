import { Router } from 'express';
import authRoutes from './auth.route';
import courseRoutes from './course.route';
import enrollmentRoutes from './enrollment.route';
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

export default router;

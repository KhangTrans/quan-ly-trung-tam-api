import { Router } from 'express';
import authRoutes from './auth.route';
import courseRoutes from './course.route';
import enrollmentRoutes from './enrollment.route';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

// Health check
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

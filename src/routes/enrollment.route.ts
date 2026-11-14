import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public: Student registers for a course/consulting
router.post('/', EnrollmentController.register);

// Protected: Admin and Staff view and manage enrollments
router.get('/', authenticate, authorize('admin', 'staff'), EnrollmentController.getAll);
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), EnrollmentController.updateStatus);

export default router;

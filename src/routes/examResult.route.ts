import { Router } from 'express';
import { ExamResultController } from '../controllers/examResult.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, ExamResultController.getAllExamResults);
router.get('/:id', authenticate, ExamResultController.getExamResultById);
router.post('/', authenticate, authorize('admin', 'staff', 'teacher'), ExamResultController.createExamResult);
router.put('/:id', authenticate, authorize('admin', 'staff', 'teacher'), ExamResultController.updateExamResult);
router.delete('/:id', authenticate, authorize('admin'), ExamResultController.deleteExamResult);

export default router;

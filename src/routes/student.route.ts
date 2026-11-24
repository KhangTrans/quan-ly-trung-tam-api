import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, StudentController.getAllStudents);
router.get('/:id', authenticate, StudentController.getStudentById);
router.post('/', authenticate, authorize('admin', 'staff'), StudentController.createStudent);
router.put('/:id', authenticate, authorize('admin', 'staff'), StudentController.updateStudent);
router.delete('/:id', authenticate, authorize('admin'), StudentController.deleteStudent);

export default router;

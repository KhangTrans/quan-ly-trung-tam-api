import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createClassSchema, updateClassSchema } from '../validations/class.validation';

const router = Router();

router.get('/teachers', ClassController.getTeachers);
router.get('/', ClassController.getAllClasses);
router.get('/:id', ClassController.getClassById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createClassSchema),
  ClassController.createClass
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateClassSchema),
  ClassController.updateClass
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ClassController.deleteClass
);

export default router;

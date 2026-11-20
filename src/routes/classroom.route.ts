import { Router } from 'express';
import { ClassroomController } from '../controllers/classroom.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createClassroomSchema, updateClassroomSchema } from '../validations/classroom.validation';

const router = Router();

router.get('/', ClassroomController.getAllClassrooms);
router.get('/:id', ClassroomController.getClassroomById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createClassroomSchema),
  ClassroomController.createClassroom
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateClassroomSchema),
  ClassroomController.updateClassroom
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ClassroomController.deleteClassroom
);

export default router;

import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createCourseSchema, updateCourseSchema } from '../validations/course.validation';

const router = Router();

// Public routes
router.get('/', CourseController.getAllCourses);
router.get('/:id', CourseController.getCourseById);

// Protected routes (Admin & Staff)
router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createCourseSchema),
  CourseController.createCourse
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateCourseSchema),
  CourseController.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  CourseController.deleteCourse
);

export default router;

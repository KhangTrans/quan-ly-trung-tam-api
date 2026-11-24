import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createCourseSchema, updateCourseSchema } from '../validations/course.validation';

const router = Router();

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Lấy danh sách các khóa học tiếng Nhật (kèm phân trang, lọc, tìm kiếm)
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm kiếm theo tên hoặc mã khóa học
 *       - in: query
 *         name: level
 *         schema: { type: string, enum: [N5, N4, N3, N2, N1, Kaiwa] }
 *         description: Lọc theo cấp độ JLPT
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [upcoming, ongoing, completed, cancelled] }
 *         description: Trạng thái khóa học
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách khóa học thành công
 */
router.get('/', CourseController.getAllCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Xem thông tin chi tiết một khóa học
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID của khóa học
 *     responses:
 *       200:
 *         description: Lấy chi tiết khóa học thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.get('/:id', CourseController.getCourseById);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Tạo khóa học mới (Yêu cầu quyền Admin hoặc Staff)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - code
 *               - level
 *               - totalSessions
 *               - tuitionFee
 *             properties:
 *               title: { type: string, example: Khóa học Tiếng Nhật N4 Cấp Tốc }
 *               code: { type: string, example: JPN-N4-INTENSIVE }
 *               level: { type: string, enum: [N5, N4, N3, N2, N1, Kaiwa], example: N4 }
 *               description: { type: string, example: Luyện thi N4 trong 3 tháng }
 *               textbook: { type: string, example: Minna no Nihongo II }
 *               totalSessions: { type: number, example: 45 }
 *               tuitionFee: { type: number, example: 4200000 }
 *               maxStudents: { type: number, example: 20 }
 *     responses:
 *       201:
 *         description: Tạo khóa học thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createCourseSchema),
  CourseController.createCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Cập nhật thông tin khóa học (Yêu cầu quyền Admin hoặc Staff)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               tuitionFee: { type: number }
 *               totalSessions: { type: number }
 *               status: { type: string, enum: [upcoming, ongoing, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy khóa học
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateCourseSchema),
  CourseController.updateCourse
);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Xóa một khóa học (Chỉ dành riêng cho Admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Xóa khóa học thành công
 *       403:
 *         description: Không có quyền thực hiện
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  CourseController.deleteCourse
);

export default router;

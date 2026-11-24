import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Ghi danh / Đăng ký lớp học
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - classId
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: 6735c05c58a5e0d297a7e112
 *               classId:
 *                 type: string
 *                 example: 6735c05c58a5e0d297a7e223
 *               notes:
 *                 type: string
 *                 example: Đăng ký ca tối thứ 2-4-6
 *     responses:
 *       201:
 *         description: Đăng ký ghi danh thành công
 *       404:
 *         description: Lớp học hoặc học viên không tồn tại
 *       409:
 *         description: Học viên đã được ghi danh vào lớp học này
 */
router.post('/', EnrollmentController.register);

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Xem danh sách học viên ghi danh (Yêu cầu quyền Admin hoặc Staff)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *         description: Lọc danh sách theo ID lớp học
 *     responses:
 *       200:
 *         description: Lấy danh sách ghi danh thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/', authenticate, authorize('admin', 'staff'), EnrollmentController.getAll);

/**
 * @swagger
 * /enrollments/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái ghi danh (Yêu cầu quyền Admin hoặc Staff)
 *     tags: [Enrollments]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [enrolled, reserved, transferred, dropped]
 *                 example: enrolled
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       404:
 *         description: Không tìm thấy bản ghi ghi danh
 */
router.patch('/:id/status', authenticate, authorize('admin', 'staff'), EnrollmentController.updateStatus);

export default router;

import { Router } from 'express';
import { BranchController } from '../controllers/branch.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createBranchSchema, updateBranchSchema } from '../validations/branch.validation';

const router = Router();

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: Lấy danh sách các cơ sở/chi nhánh của trung tâm
 *     tags: [Branches]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Tìm theo tên, mã hoặc địa chỉ
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *         description: Lọc trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Danh sách chi nhánh
 */
router.get('/', BranchController.getAllBranches);

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Xem chi tiết một chi nhánh
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thông tin chi nhánh
 */
router.get('/:id', BranchController.getBranchById);

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Thêm mới một cơ sở/chi nhánh (Admin/Staff)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createBranchSchema),
  BranchController.createBranch
);

/**
 * @swagger
 * /branches/{id}:
 *   put:
 *     summary: Cập nhật thông tin chi nhánh (Admin/Staff)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateBranchSchema),
  BranchController.updateBranch
);

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Xóa một chi nhánh (Admin only)
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  BranchController.deleteBranch
);

export default router;

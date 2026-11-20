import { Router } from 'express';
import { ShiftSlotController } from '../controllers/shiftSlot.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createShiftSlotSchema, updateShiftSlotSchema } from '../validations/shiftSlot.validation';

const router = Router();

router.get('/', ShiftSlotController.getAllShiftSlots);
router.get('/:id', ShiftSlotController.getShiftSlotById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  validate(createShiftSlotSchema),
  ShiftSlotController.createShiftSlot
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  validate(updateShiftSlotSchema),
  ShiftSlotController.updateShiftSlot
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  ShiftSlotController.deleteShiftSlot
);

export default router;

import { Router } from 'express';
import { TextbookController } from '../controllers/textbook.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadPdf } from '../middlewares/uploadPdf.middleware';

const router = Router();

router.get('/', TextbookController.getAllTextbooks);
router.get('/:id', TextbookController.getTextbookById);

router.post(
  '/upload-pdf',
  authenticate,
  authorize('admin', 'staff'),
  uploadPdf.single('file'),
  TextbookController.uploadPdfFile
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  TextbookController.createTextbook
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  TextbookController.updateTextbook
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  TextbookController.deleteTextbook
);

export default router;

import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, InvoiceController.getAllInvoices);
router.get('/:id', authenticate, InvoiceController.getInvoiceById);
router.post('/', authenticate, authorize('admin', 'staff'), InvoiceController.createInvoice);
router.put('/:id', authenticate, authorize('admin', 'staff'), InvoiceController.updateInvoice);
router.post('/:id/cancel', authenticate, authorize('admin', 'staff'), InvoiceController.cancelInvoice);
router.delete('/:id', authenticate, authorize('admin'), InvoiceController.deleteInvoice);

export default router;

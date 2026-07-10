import { Router } from 'express';
import * as billingController from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), billingController.getAllBillings);
router.get('/my', authenticate, billingController.getMyBillings);
router.get('/member/:memberId', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), billingController.getMemberBillings);
router.post('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), billingController.createBilling);
router.post('/pay', authenticate, billingController.processPayment);
router.post('/verify', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), billingController.verifyPayment);
router.delete('/:id', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT']), billingController.deleteBilling);
router.patch('/:id', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), billingController.updateBillingAmount);


export default router;

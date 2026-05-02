import { Router } from 'express';
import * as billingController from '../controllers/billingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/my', authenticate, billingController.getMyBillings);
router.get('/member/:memberId', authenticate, billingController.getMemberBillings);
router.post('/', authenticate, billingController.createBilling);
router.post('/pay', authenticate, billingController.processPayment);


export default router;

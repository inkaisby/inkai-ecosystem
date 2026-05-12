import { Router } from 'express';
import * as verificationController from '../controllers/verificationController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/claim', authenticate, verificationController.createClaim);
router.get('/my', authenticate, verificationController.getMyClaims);
router.get('/pending', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), verificationController.getPendingClaims);
router.post('/:id/process', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), verificationController.processClaim);

export default router;

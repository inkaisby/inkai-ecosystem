import { Router } from 'express';
import * as verificationController from '../controllers/verificationController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.post('/claim', authenticate, verificationController.createClaim);
router.get('/my', authenticate, verificationController.getMyClaims);
router.get('/pending', authenticate, authorize(['ADMIN']), verificationController.getPendingClaims);
router.post('/:id/process', authenticate, authorize(['ADMIN']), verificationController.processClaim);

export default router;

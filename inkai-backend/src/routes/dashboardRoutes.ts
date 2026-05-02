import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticate, authorize(['ADMIN']), dashboardController.getStats);
router.get('/recent-activities', authenticate, authorize(['ADMIN']), dashboardController.getRecentActivities);

export default router;

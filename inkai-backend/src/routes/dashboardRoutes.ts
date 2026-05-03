import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN']), dashboardController.getStats);
router.get('/recent-activities', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN']), dashboardController.getRecentActivities);

export default router;

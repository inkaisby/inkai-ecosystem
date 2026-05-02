import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/my', authenticate, notificationController.getMyNotifications);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.post('/broadcast', authenticate, authorize(['ADMIN']), notificationController.broadcastNotification);

export default router;

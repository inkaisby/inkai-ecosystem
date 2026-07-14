import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import * as settingsController from '../controllers/settingsController';

const router = Router();
const adminRoles = ['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO', 'ADMIN'];

router.get('/', authenticate, authorize(adminRoles), settingsController.getSettingsByPrefix);
router.get('/:key', authenticate, authorize(adminRoles), settingsController.getSetting);
router.put('/:key', authenticate, authorize(adminRoles), settingsController.upsertSetting);

export default router;

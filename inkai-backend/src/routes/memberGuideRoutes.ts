import { Router } from 'express';

import * as memberGuideController from '../controllers/memberGuideController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

const ADMIN_ROLES = [
  'ADMINISTRATOR',
  'ADMIN_PUSAT',
  'ADMIN_PROVINCE',
  'ADMIN_BRANCH',
  'ADMIN_DOJO',
  'ADMIN',
];

router.get('/member-mobile-welcome', memberGuideController.getPublicMemberGuide);
router.put(
  '/member-mobile-welcome',
  authenticate,
  authorize(ADMIN_ROLES),
  memberGuideController.putAdminMemberGuide,
);

export default router;

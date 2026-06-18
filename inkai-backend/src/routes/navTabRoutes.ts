import { Router } from 'express';
import * as navTabController from '../controllers/navTabController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLES = ['ADMINISTRATOR', 'ADMIN_PUSAT'];

router.get('/', navTabController.getAllTabs);
router.get('/:slug', navTabController.getTabBySlug);

// Protected routes (PP Admin / Administrator only)
router.post('/', authenticate, authorize(ADMIN_ROLES), navTabController.createTab);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), navTabController.updateTab);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), navTabController.deleteTab);

export default router;

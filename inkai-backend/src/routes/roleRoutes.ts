import { Router } from 'express';
import * as roleController from '../controllers/roleController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Only ADMINISTRATOR can manage roles and permissions
router.get('/', authenticate, authorize(['ADMINISTRATOR']), roleController.getAllRoles);
router.get('/permissions', authenticate, authorize(['ADMINISTRATOR']), roleController.getAllPermissions);
router.put('/:roleId/permissions', authenticate, authorize(['ADMINISTRATOR']), roleController.updateRolePermissions);

export default router;

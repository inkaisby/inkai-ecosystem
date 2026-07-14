import { Router } from 'express';
import { createAuditLog, getAuditLogs } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const adminRoles = ['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO', 'ADMIN'];

router.get('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT']), getAuditLogs);
router.post('/', authenticate, authorize(adminRoles), createAuditLog);

export default router;

import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT']), getAuditLogs);

export default router;

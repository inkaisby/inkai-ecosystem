import { Router } from 'express';
import { pull, push } from '../controllers/syncController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Sync endpoints
router.get('/pull', authenticate, pull);
router.post('/push', authenticate, push);

export default router;

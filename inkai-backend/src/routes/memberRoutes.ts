import { Router } from 'express';
import { getMyProfile, updateMyProfile, getAllMembers } from '../controllers/memberController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllMembers);
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);


export default router;

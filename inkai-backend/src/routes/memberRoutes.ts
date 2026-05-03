import { Router } from 'express';
import { getMyProfile, updateMyProfile, getAllMembers, getMyChildren, addChildMember, createMember, updateMember } from '../controllers/memberController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllMembers);
router.post('/', authenticate, createMember);
router.patch('/:id', authenticate, updateMember);
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);
router.get('/me/children', authenticate, getMyChildren);
router.post('/me/children', authenticate, addChildMember);


export default router;

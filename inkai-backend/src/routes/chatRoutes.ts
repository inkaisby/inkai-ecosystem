import { Router } from 'express';
import { getConversations, getMessages, createConversation } from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/conversations', authenticate, getConversations);
router.get('/messages/:conversationId', authenticate, getMessages);
router.post('/conversations', authenticate, createConversation);

export default router;

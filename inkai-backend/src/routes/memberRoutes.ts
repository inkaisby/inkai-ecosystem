import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// 1. Static & Specific routes first
router.get('/verify/:id', memberController.verifyMember);
router.get('/me', authenticate, memberController.getMyProfile);
router.patch('/me', authenticate, memberController.updateMyProfile);
router.get('/me/children', authenticate, memberController.getMyChildren);
router.post('/me/children', authenticate, memberController.addChildMember);
router.post('/upload-document', authenticate, upload.single('document'), memberController.uploadDocument);
router.post('/bulk', authenticate, memberController.bulkCreateMembers);

// 2. Collection routes
router.get('/', authenticate, memberController.getAllMembers);
router.post('/', authenticate, memberController.createMember);

// 3. Wildcard ID routes last
router.get('/:id', authenticate, memberController.getMemberDetail);
router.patch('/:id', authenticate, memberController.updateMember);
router.delete('/:id', authenticate, memberController.deleteMember);

export default router;

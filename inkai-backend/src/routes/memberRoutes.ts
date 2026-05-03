import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit on server side
});

const router = Router();

router.get('/', authenticate, memberController.getAllMembers);
router.post('/', authenticate, memberController.createMember);
router.patch('/:id', authenticate, memberController.updateMember);
router.get('/me', authenticate, memberController.getMyProfile);
router.patch('/me', authenticate, memberController.updateMyProfile);
router.get('/me/children', authenticate, memberController.getMyChildren);
router.post('/me/children', authenticate, memberController.addChildMember);
router.post('/upload-document', authenticate, upload.single('document'), memberController.uploadDocument);


export default router;

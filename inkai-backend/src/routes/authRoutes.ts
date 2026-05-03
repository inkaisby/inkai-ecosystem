import { Router } from 'express';
import { login, register, changePassword, uploadProfilePhoto, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for avatars
});

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/change-password', authenticate, changePassword);
router.post('/upload-photo', authenticate, upload.single('photo'), uploadProfilePhoto);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

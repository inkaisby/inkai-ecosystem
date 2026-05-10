import { Router } from 'express';
import { login, adminLogin, register, changePassword, uploadProfilePhoto, forgotPassword, resetPassword, updateProfile, uploadFile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for files
});

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/upload-photo', authenticate, upload.single('photo'), uploadProfilePhoto);
router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

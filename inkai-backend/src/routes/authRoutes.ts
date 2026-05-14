import { Router } from 'express';
import { login, adminLogin, getSession, register, changePassword, uploadProfilePhoto, forgotPassword, resetPassword, updateProfile, uploadFile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authLoginLimiter } from '../middleware/loginRateLimit';
import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

router.post('/register', register);
router.post('/login', authLoginLimiter, login);
router.get('/me', authenticate, getSession);
router.post('/admin-login', authLoginLimiter, adminLogin);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/upload-photo', authenticate, upload.single('photo'), uploadProfilePhoto);
router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

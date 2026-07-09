import { Router } from 'express';
import { login, adminLogin, getSession, register, changePassword, uploadProfilePhoto, forgotPassword, resetPassword, updateProfile, uploadFile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { authLoginLimiter } from '../middleware/loginRateLimit';
import { sensitiveActionLimiter } from '../middleware/securityMiddleware';
import multer from 'multer';

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG, WebP, GIF) yang diizinkan') as any);
    }
  },
});

const uploadDoc = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar dan PDF yang diizinkan') as any);
    }
  },
});

const router = Router();

router.post('/register', sensitiveActionLimiter, register);
router.post('/login', authLoginLimiter, login);
router.get('/me', authenticate, getSession);
router.post('/admin-login', authLoginLimiter, adminLogin);
router.post('/logout', authenticate, logout);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, sensitiveActionLimiter, changePassword);
router.post('/upload-photo', authenticate, uploadPhoto.single('photo'), uploadProfilePhoto);
router.post('/upload', authenticate, uploadDoc.single('file'), uploadFile);
router.post('/forgot-password', sensitiveActionLimiter, forgotPassword);
router.post('/reset-password', sensitiveActionLimiter, resetPassword);

export default router;

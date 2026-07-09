import { Router } from 'express';
import * as memberController from '../controllers/memberController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import multer from 'multer';

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

const uploadDoc = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG, WebP) dan PDF yang diizinkan') as any);
    }
  }
});

const router = Router();

// 1. Static & Specific routes first
router.get('/verify/:id', memberController.verifyMember);
router.get('/me', authenticate, memberController.getMyProfile);
router.patch('/me', authenticate, memberController.updateMyProfile);
router.get('/me/children', authenticate, memberController.getMyChildren);
router.post('/me/children', authenticate, memberController.addChildMember);
router.post('/upload-document', authenticate, uploadDoc.single('document'), memberController.uploadDocument);
router.patch('/:memberId/ranks/:rankId', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH']), memberController.updateMemberRank);
router.post('/bulk', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT']), memberController.bulkCreateMembers);

// 2. Collection routes
router.get('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), memberController.getAllMembers);
router.post('/', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), memberController.createMember);
router.post('/:id/provision-login', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), memberController.provisionMemberLogin);

// 3. Wildcard ID routes last
router.get('/:id', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), memberController.getMemberDetail);
router.patch('/:id', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT', 'ADMIN_PROVINCE', 'ADMIN_BRANCH', 'ADMIN_DOJO']), memberController.updateMember);
router.delete('/:id', authenticate, authorize(['ADMINISTRATOR', 'ADMIN_PUSAT']), memberController.deleteMember);

export default router;

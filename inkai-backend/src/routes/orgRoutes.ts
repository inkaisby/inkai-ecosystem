import { Router } from 'express';
import { getProvinces, getBranches, getDojos, getDojo, searchDojos, createProvince, updateProvince, createBranch, updateBranch, createDojo, updateDojo } from '../controllers/orgController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Publicly read organizational structure
router.get('/provinces', getProvinces);
router.get('/branches/all', getBranches);
router.get('/branches/:provinceId', getBranches);
router.get('/dojos/all', getDojos);
router.get('/dojos/search', searchDojos);
router.get('/dojos/:branchId', getDojos);
router.get('/dojo/:id', getDojo);

// Mutation endpoints must be fully protected
const adminRoles = ['ADMINISTRATOR', 'ADMIN_PUSAT'];
const provinceAdminRoles = [...adminRoles, 'ADMIN_PROVINCE'];
const branchAdminRoles = [...provinceAdminRoles, 'ADMIN_BRANCH'];

router.post('/provinces', authenticate, authorize(adminRoles), createProvince);
router.patch('/provinces/:id', authenticate, authorize(adminRoles), updateProvince);

router.post('/branches', authenticate, authorize(provinceAdminRoles), createBranch);
router.patch('/branches/:id', authenticate, authorize(provinceAdminRoles), updateBranch);

router.post('/dojos', authenticate, authorize(branchAdminRoles), createDojo);
router.patch('/dojos/:id', authenticate, authorize(branchAdminRoles), updateDojo);

export default router;

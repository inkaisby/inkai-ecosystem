import { Router } from 'express';
import { 
  getProvinces, 
  getBranches, 
  getDojos,
  getDojo, 
  searchDojos,
  createProvince,
  createBranch,
  createDojo,
  updateProvince,
  updateBranch,
  updateDojo
} from '../controllers/orgController';

import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/provinces', authenticate, getProvinces);
router.get('/branches/all', authenticate, getBranches);
router.get('/branches/:provinceId', authenticate, getBranches);
router.get('/dojos/all', authenticate, getDojos);
router.get('/dojos/search', authenticate, searchDojos);
router.get('/dojos/:branchId', authenticate, getDojos);
router.get('/dojo/:id', authenticate, getDojo);

router.post('/provinces', authenticate, createProvince);
router.post('/branches', authenticate, createBranch);
router.post('/dojos', authenticate, createDojo);

router.patch('/provinces/:id', authenticate, updateProvince);
router.patch('/branches/:id', authenticate, updateBranch);
router.patch('/dojos/:id', authenticate, updateDojo);

export default router;

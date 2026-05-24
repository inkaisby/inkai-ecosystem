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

router.get('/provinces', getProvinces);
router.get('/branches/all', getBranches);
router.get('/branches/:provinceId', getBranches);
router.get('/dojos/all', getDojos);
router.get('/dojos/search', searchDojos);
router.get('/dojos/:branchId', getDojos);
router.get('/dojo/:id', getDojo);

router.post('/provinces', authenticate, createProvince);
router.post('/branches', authenticate, createBranch);
router.post('/dojos', authenticate, createDojo);

router.patch('/provinces/:id', authenticate, updateProvince);
router.patch('/branches/:id', authenticate, updateBranch);
router.patch('/dojos/:id', authenticate, updateDojo);

export default router;

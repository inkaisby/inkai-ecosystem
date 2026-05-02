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

const router = Router();

router.get('/provinces', getProvinces);
router.get('/branches/:provinceId', getBranches);
router.get('/dojos/search', searchDojos);
router.get('/dojos/:branchId', getDojos);
router.get('/dojo/:id', getDojo);

router.post('/provinces', createProvince);
router.post('/branches', createBranch);
router.post('/dojos', createDojo);

router.patch('/provinces/:id', updateProvince);
router.patch('/branches/:id', updateBranch);
router.patch('/dojos/:id', updateDojo);

export default router;

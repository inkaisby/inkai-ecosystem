import { Router } from 'express';
import { getProvinces, getBranches, getDojos, searchDojos } from '../controllers/orgController';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/branches/:provinceId', getBranches);
router.get('/dojos/search', searchDojos);
router.get('/dojos/:branchId', getDojos);


export default router;

import { Router } from 'express';
import { syncAttendance, getDojoAttendance, getAllAttendance } from '../controllers/attendanceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllAttendance);
router.post('/sync', authenticate, syncAttendance);
router.get('/dojo/:dojoId', authenticate, getDojoAttendance);


export default router;

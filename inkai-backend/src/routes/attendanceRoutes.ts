import { Router } from 'express';
import { syncAttendance, getDojoAttendance, getAllAttendance, checkIn } from '../controllers/attendanceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getAllAttendance);
router.get('/logs', authenticate, getAllAttendance);
router.post('/sync', authenticate, syncAttendance);
router.post('/checkin', authenticate, checkIn);
router.get('/dojo/:dojoId', authenticate, getDojoAttendance);


export default router;

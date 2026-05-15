import { Router } from 'express';
import {
  syncAttendance,
  getDojoAttendance,
  getAllAttendance,
  checkIn,
  getMyAttendance,
  updateAttendanceStaff,
  softDeleteAttendanceStaff,
} from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

const STAFF_ATTENDANCE_ROLES = [
  'ADMINISTRATOR',
  'ADMIN_PUSAT',
  'ADMIN_PROVINCE',
  'ADMIN_BRANCH',
  'ADMIN_DOJO',
];

router.get('/me', authenticate, getMyAttendance);
router.get('/', authenticate, authorize(STAFF_ATTENDANCE_ROLES), getAllAttendance);
router.get('/logs', authenticate, authorize(STAFF_ATTENDANCE_ROLES), getAllAttendance);
router.get('/dojo/:dojoId', authenticate, authorize(STAFF_ATTENDANCE_ROLES), getDojoAttendance);
router.patch('/:id', authenticate, authorize(STAFF_ATTENDANCE_ROLES), updateAttendanceStaff);
router.delete('/:id', authenticate, authorize(STAFF_ATTENDANCE_ROLES), softDeleteAttendanceStaff);
router.post('/sync', authenticate, syncAttendance);
router.post('/checkin', authenticate, checkIn);

export default router;

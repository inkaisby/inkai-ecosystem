import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authenticate, eventController.createEvent);
router.post('/register', authenticate, eventController.registerForEvent);
router.put('/register/:id', authenticate, eventController.updateRegistration);
router.put('/:id', authenticate, eventController.updateEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);

export default router;

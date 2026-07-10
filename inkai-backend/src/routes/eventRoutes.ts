import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/rank-fee-templates', authenticate, eventController.getRankFeeTemplates);
router.put('/rank-fee-templates', authenticate, eventController.updateRankFeeTemplates);
router.get('/', optionalAuthenticate, eventController.getAllEvents);
router.get('/my/registrations', authenticate, eventController.getMyEvents);
router.get('/:id', optionalAuthenticate, eventController.getEventById);
router.post('/', authenticate, eventController.createEvent);
router.post('/register/bulk', authenticate, eventController.bulkRegisterForEvent);
router.post('/register', authenticate, eventController.registerForEvent);
router.put('/register/:id', authenticate, eventController.updateRegistration);
router.delete('/register/:id', authenticate, eventController.deleteRegistration);
router.patch('/:id', authenticate, eventController.updateEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);

export default router;

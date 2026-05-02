import { Router } from 'express';
import * as eventController from '../controllers/eventController';

const router = Router();

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.post('/register', eventController.registerForEvent);

export default router;

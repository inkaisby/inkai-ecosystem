import { Router } from 'express';
import * as newsCarouselController from '../controllers/newsCarouselController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLES = ['ADMINISTRATOR', 'ADMIN_PUSAT'];

router.get('/', newsCarouselController.getAllCarouselItems);
router.get('/:id', newsCarouselController.getCarouselItemById);

// Protected routes (PP Admin / Administrator only)
router.post('/', authenticate, authorize(ADMIN_ROLES), newsCarouselController.createCarouselItem);
router.put('/:id', authenticate, authorize(ADMIN_ROLES), newsCarouselController.updateCarouselItem);
router.delete('/:id', authenticate, authorize(ADMIN_ROLES), newsCarouselController.deleteCarouselItem);

export default router;

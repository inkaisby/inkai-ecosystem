import { Router } from 'express';
import * as matchController from '../controllers/matchController';

const router = Router();

router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatchById);
router.patch('/:id', matchController.updateMatch);
router.put('/:id', matchController.updateMatch);
router.post('/', matchController.createMatch);

export default router;

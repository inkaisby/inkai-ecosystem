import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.get('/', inventoryController.getAllProducts);
router.get('/:id', inventoryController.getProductById);
router.post('/', inventoryController.createProduct);
router.patch('/:id', inventoryController.updateProduct);

export default router;

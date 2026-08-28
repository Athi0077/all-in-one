import express from 'express';
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  cancelOrder,
  verifyOrderPayment
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/verify-payment').post(protect, verifyOrderPayment);

export default router;

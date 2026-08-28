import express from 'express';
import {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByCategory,
  createProductReview,
  getProductReviews,
  getProductAiSummary,
  getRelatedProducts
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts);
router.route('/featured').get(getFeaturedProducts);
router.route('/category/:slug').get(getProductsByCategory);
router.route('/:id').get(getProductById);
router.route('/:id/ai-summary').get(getProductAiSummary);
router.route('/:id/related').get(getRelatedProducts);
router.route('/:id/reviews').get(getProductReviews).post(protect, createProductReview);

export default router;

import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminOrders,
  updateOrderStatus,
  getAdminUsers,
  getAdminUserById,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getReviews,
  updateReviewStatus,
  deleteReview,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';

const router = express.Router();

// All routes here are protected and admin only
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.route('/products')
  .get(getAdminProducts)
  .post(createProduct);
router.route('/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

// Categories
router.route('/categories')
  .post(createCategory);
router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Users
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);

// Coupons
router.route('/coupons')
  .get(getCoupons)
  .post(createCoupon);
router.route('/coupons/:id')
  .put(updateCoupon)
  .delete(deleteCoupon);

// Reviews
router.get('/reviews', getReviews);
router.route('/reviews/:id')
  .put(updateReviewStatus)
  .delete(deleteReview);

// Settings
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

export default router;

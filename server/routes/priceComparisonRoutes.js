import express from 'express';
import { getPriceComparison } from '../controllers/priceComparisonController.js';

const router = express.Router();

router.get('/', getPriceComparison);

export default router;

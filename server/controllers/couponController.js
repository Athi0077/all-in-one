import Coupon from '../models/couponModel.js';

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      res.status(400);
      throw new Error('Coupon code is required');
    }

    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      res.status(404);
      throw new Error('Invalid or inactive coupon code');
    }

    if (new Date() < new Date(coupon.startDate)) {
      res.status(400);
      throw new Error('Coupon is not yet active');
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      res.status(400);
      throw new Error('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400);
      throw new Error('Coupon usage limit reached');
    }

    if (orderAmount < coupon.minOrderAmount) {
      res.status(400);
      throw new Error(`Minimum order amount of $${coupon.minOrderAmount} required`);
    }

    let discount = coupon.discountType === 'Percentage' 
      ? (orderAmount * coupon.discountValue) / 100 
      : coupon.discountValue;

    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount
      }
    });
  } catch (error) {
    next(error);
  }
};

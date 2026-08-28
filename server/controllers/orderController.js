import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Coupon from '../models/couponModel.js';
import { validateAndCalculateStock, decrementStock, restoreStock } from '../services/inventoryService.js';
import { createPayment, verifyPayment } from '../services/paymentService.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate Stock and Calculate Subtotal
      const { subtotal, validatedItems } = await validateAndCalculateStock(orderItems, session);

      // 2. Validate Coupon and Calculate Discount
      let discount = 0;
      let couponAppliedId = null;

      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode, isActive: true }).session(session);
        if (!coupon) throw new Error('Invalid or inactive coupon code');
        if (new Date() < new Date(coupon.startDate)) throw new Error('Coupon is not yet active');
        if (new Date() > new Date(coupon.expiryDate)) throw new Error('Coupon has expired');
        if (coupon.usedCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached');
        if (subtotal < coupon.minOrderAmount) throw new Error(`Minimum order amount of $${coupon.minOrderAmount} required`);

        discount = coupon.discountType === 'Percentage' 
          ? (subtotal * coupon.discountValue) / 100 
          : coupon.discountValue;

        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }

        // Increment coupon usage
        coupon.usedCount += 1;
        await coupon.save({ session });
        couponAppliedId = coupon._id;
      }

      // 3. Calculate Final Totals
      const shippingCharge = subtotal > 100 ? 0 : 10; // Simple logic: free shipping over $100
      const total = subtotal - discount + shippingCharge;

      // 4. Create Order
      const order = new Order({
        user: req.user._id,
        items: validatedItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        discount,
        couponApplied: couponAppliedId,
        shippingCharge,
        total,
      });

      const createdOrder = await order.save({ session });

      // 5. Update Inventory
      await decrementStock(validatedItems, session);

      // 6. Handle Payment logic
      if (paymentMethod === 'Online Payment') {
        const paymentResult = await createPayment(total, 'INR');
        createdOrder.paymentResult = { id: paymentResult.id, status: 'Initiated' };
        await createdOrder.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        data: createdOrder
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      res.status(400);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (order.orderStatus !== 'Pending') {
      res.status(400);
      throw new Error(`Order cannot be cancelled once it is ${order.orderStatus}.`);
    }

    order.orderStatus = 'Cancelled';
    
    if (order.paymentStatus === 'Completed') {
       order.paymentStatus = 'Refunded';
       // In real-world, call paymentService.processRefund() here
    }

    await order.save({ session });

    // Restore inventory
    await restoreStock(order.items, session);

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc    Verify order payment from Razorpay
// @route   POST /api/orders/:id/verify-payment
// @access  Private
export const verifyOrderPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to verify this order');
    }

    const verificationResult = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (verificationResult.success) {
      order.paymentStatus = 'Completed';
      order.orderStatus = 'Processing'; // Update from Pending to Processing
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'Completed',
        update_time: new Date().toISOString(),
      };

      const updatedOrder = await order.save();

      res.json({ success: true, data: updatedOrder });
    } else {
      res.status(400);
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      // Check if user is admin or the order belongs to the user
      if (req.user.role === 'admin' || order.user._id.toString() === req.user._id.toString()) {
        res.json(order);
      } else {
        res.status(401);
        throw new Error('Not authorized to view this order');
      }
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

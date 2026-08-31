import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Coupon from '../models/couponModel.js';
import Counter from '../models/counterModel.js';
import { validateAndCalculateStock, decrementStock, restoreStock } from '../services/inventoryService.js';
import { createPayment, verifyPayment } from '../services/paymentService.js';
import { sendEmail } from '../services/emailService.js';

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
      const shippingCharge = validatedItems.reduce((acc, item) => acc + (item.shippingCharge || 0) * item.qty, 0);
      const total = subtotal - discount + shippingCharge;

      // 4. Generate Order ID
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      );
      
      // Initialize to 100 if it was just created (starts at 1 in some MongoDB versions with upsert)
      let currentOrderId = counter.seq;
      if (currentOrderId < 100) {
        currentOrderId = 100;
        counter.seq = 100;
        await counter.save({ session });
      }

      // 5. Create Order
      const order = new Order({
        user: req.user._id,
        orderId: currentOrderId,
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

      // 6. Update Inventory
      await decrementStock(validatedItems, session);

      // 7. Handle Payment logic
      if (paymentMethod === 'Online Payment') {
        const paymentResult = await createPayment(total, 'INR');
        createdOrder.paymentResult = { id: paymentResult.id, status: 'Initiated' };
        await createdOrder.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      // Send email if it's COD. Online payment sends after verifyPayment.
      if (paymentMethod === 'Cash on Delivery') {
        const getOrdinalSuffix = (i) => {
          const j = i % 10, k = i % 100;
          if (j === 1 && k !== 11) return i + "st";
          if (j === 2 && k !== 12) return i + "nd";
          if (j === 3 && k !== 13) return i + "rd";
          return i + "th";
        };
        const itemsHtml = validatedItems.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <strong>${item.name}</strong><br/>
              ${item.size ? `<small>Size: ${item.size}</small>` : ''}
              ${typeof item.imageIndex === 'number' ? `<small style="margin-left:8px; color: #666;">[${getOrdinalSuffix(item.imageIndex + 1)} Image]</small>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
          </tr>
        `).join('');
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px; background-color: #4f46e5; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
            </div>
            <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #eee; border-top: none;">
              <p>Hi ${req.user.name},</p>
              <p>Thank you for shopping with AllinOne Store! Your Cash on Delivery order <strong>#${createdOrder.orderId}</strong> has been confirmed.</p>
              
              <h3 style="margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6; text-align: left;">
                    <th style="padding: 12px;">Item</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Subtotal</strong></td>
                    <td style="padding: 12px; text-align: right;">$${createdOrder.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Shipping</strong></td>
                    <td style="padding: 12px; text-align: right;">$${createdOrder.shippingCharge.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-size: 18px;"><strong>Total</strong></td>
                    <td style="padding: 12px; text-align: right; font-size: 18px;"><strong>$${createdOrder.total.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        `;
        
        sendEmail({
          to: req.user.email,
          subject: `Order Confirmation #${createdOrder.orderId}`,
          html
        }).catch(err => console.error("Email send failed:", err));
      }

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

      const getOrdinalSuffix = (i) => {
        const j = i % 10, k = i % 100;
        if (j === 1 && k !== 11) return i + "st";
        if (j === 2 && k !== 12) return i + "nd";
        if (j === 3 && k !== 13) return i + "rd";
        return i + "th";
      };

      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br/>
            ${item.size ? `<small>Size: ${item.size}</small>` : ''}
            ${typeof item.imageIndex === 'number' ? `<small style="margin-left:8px; color: #666;">[${getOrdinalSuffix(item.imageIndex + 1)} Image]</small>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `).join('');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px; background-color: #4f46e5; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Payment Successful & Order Confirmed!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #eee; border-top: none;">
            <p>Hi ${req.user.name},</p>
            <p>We have successfully received your payment! Your order <strong>#${updatedOrder.orderId}</strong> has been confirmed.</p>
            
            <h3 style="margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6; text-align: left;">
                  <th style="padding: 12px;">Item</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;"><strong>Subtotal</strong></td>
                  <td style="padding: 12px; text-align: right;">$${updatedOrder.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;"><strong>Shipping</strong></td>
                  <td style="padding: 12px; text-align: right;">$${updatedOrder.shippingCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-size: 18px;"><strong>Total Paid</strong></td>
                  <td style="padding: 12px; text-align: right; font-size: 18px; color: #16a34a;"><strong>$${updatedOrder.total.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
      
      sendEmail({
        to: req.user.email,
        subject: `Order Confirmation #${updatedOrder.orderId}`,
        html
      }).catch(err => console.error("Email send failed:", err));

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

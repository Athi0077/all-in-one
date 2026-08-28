import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    // Fallback to test keys if not provided in env
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TAwmU8DgG4NUPu';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_fallback_secret';
    
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
};

export const createPayment = async (amount, currency = 'INR') => {
  try {
    const rzp = getRazorpayInstance();
    // Razorpay amount is in paise (multiply by 100)
    // Assume incoming amount is in Rupees
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_${Date.now()}`
    };

    const order = await rzp.orders.create(options);
    
    return {
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Razorpay create order error:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

export const verifyPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_fallback_secret';
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");
      
    if (expectedSignature === razorpay_signature) {
      return {
        success: true,
        status: 'Completed',
      };
    } else {
      return {
        success: false,
        status: 'Failed',
      };
    }
  } catch (error) {
    console.error('Razorpay verify error:', error);
    throw new Error('Payment verification failed');
  }
};

export const processRefund = async (paymentId, amount) => {
  try {
    const rzp = getRazorpayInstance();
    const amountInPaise = Math.round(amount * 100);
    
    const refund = await rzp.payments.refund(paymentId, {
      amount: amountInPaise
    });
    
    return {
      success: true,
      refundId: refund.id,
      status: 'Refunded',
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    // Ignore refund failures in this mock logic if they happen, or throw.
    throw new Error('Refund failed');
  }
};

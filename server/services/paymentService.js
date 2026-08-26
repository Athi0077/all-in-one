/**
 * Abstract Payment Service
 * In a real-world scenario, this would integrate with Stripe, Razorpay, etc.
 * Since we don't have credentials, we're building a mock test-mode architecture.
 */

const TEST_MODE = process.env.NODE_ENV !== 'production' || true; // Force test mode

export const createPayment = async (amount, currency = 'USD') => {
  if (TEST_MODE) {
    return {
      success: true,
      id: `test_pay_${Date.now()}`,
      clientSecret: `test_secret_${Date.now()}`,
      amount,
      currency,
    };
  }
  
  // Real implementation would go here (e.g. stripe.paymentIntents.create)
  throw new Error('Payment gateway not configured');
};

export const verifyPayment = async (paymentId) => {
  if (TEST_MODE) {
    return {
      success: true,
      status: 'Completed',
    };
  }

  throw new Error('Payment gateway not configured');
};

export const processRefund = async (paymentId, amount) => {
  if (TEST_MODE) {
    return {
      success: true,
      refundId: `test_refund_${Date.now()}`,
      status: 'Refunded',
    };
  }

  throw new Error('Payment gateway not configured');
};

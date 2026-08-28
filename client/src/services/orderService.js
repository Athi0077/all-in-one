import api from './api';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrderDetails = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/orders/myorders');
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await api.put(`/orders/${id}/cancel`);
  return response.data;
};

export const validateCoupon = async (code, orderAmount) => {
  const response = await api.post('/coupons/validate', { code, orderAmount });
  return response.data;
};

export const verifyPayment = async (orderId, paymentData) => {
  const response = await api.post(`/orders/${orderId}/verify-payment`, paymentData);
  return response.data;
};

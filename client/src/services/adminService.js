import api from './api';

// DASHBOARD
export const getDashboardStats = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data;
};

// PRODUCTS
export const getAdminProducts = async (page = 1, limit = 10, keyword = '') => {
  const { data } = await api.get(`\/admin/products?page=${page}&limit=${limit}&keyword=${keyword}`);
  return data;
};

export const createProduct = async (productData) => {
  const { data } = await api.post('/admin/products', productData);
  return data;
};

export const updateProduct = async (id, productData) => {
  const { data } = await api.put(`\/admin/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`\/admin/products/${id}`);
  return data;
};

// UPLOAD IMAGE
export const uploadImage = async (formData) => {
  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// CATEGORIES
export const createCategory = async (categoryData) => {
  const { data } = await api.post('/admin/categories', categoryData);
  return data;
};

export const updateCategory = async (id, categoryData) => {
  const { data } = await api.put(`\/admin/categories/${id}`, categoryData);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`\/admin/categories/${id}`);
  return data;
};

// ORDERS
export const getAdminOrders = async (page = 1, limit = 10, status = 'All') => {
  const { data } = await api.get(`\/admin/orders?page=${page}&limit=${limit}&status=${status}`);
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.put(`\/admin/orders/${id}/status`, { status });
  return data;
};

// USERS
export const getAdminUsers = async (page = 1, limit = 10, keyword = '') => {
  const { data } = await api.get(`\/admin/users?page=${page}&limit=${limit}&keyword=${keyword}`);
  return data;
};

export const getAdminUserById = async (id) => {
  const { data } = await api.get(`\/admin/users/${id}`);
  return data;
};

// COUPONS
export const getCoupons = async () => {
  const { data } = await api.get('/admin/coupons');
  return data;
};

export const createCoupon = async (couponData) => {
  const { data } = await api.post('/admin/coupons', couponData);
  return data;
};

export const updateCoupon = async (id, couponData) => {
  const { data } = await api.put(`\/admin/coupons/${id}`, couponData);
  return data;
};

export const deleteCoupon = async (id) => {
  const { data } = await api.delete(`\/admin/coupons/${id}`);
  return data;
};

// REVIEWS
export const getReviews = async () => {
  const { data } = await api.get('/admin/reviews');
  return data;
};

export const updateReviewStatus = async (id, status) => {
  const { data } = await api.put(`\/admin/reviews/${id}`, { status });
  return data;
};

export const deleteReview = async (id) => {
  const { data } = await api.delete(`\/admin/reviews/${id}`);
  return data;
};

// SETTINGS
export const getSettings = async () => {
  const { data } = await api.get('/admin/settings');
  return data;
};

export const updateSettings = async (settingsData) => {
  const { data } = await api.put('/admin/settings', settingsData);
  return data;
};

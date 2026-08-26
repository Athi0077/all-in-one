import api from './api';

export const getWishlist = async () => {
  const response = await api.get('/users/wishlist');
  return response.data;
};

export const toggleWishlist = async (productId) => {
  const response = await api.post('/users/wishlist', { productId });
  return response.data;
};

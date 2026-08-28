import api from './api';

export const getProducts = async (keyword = '', pageNumber = 1, category = '', minPrice = '', maxPrice = '', color = '', sort = '') => {
  let url = `/products?keyword=${keyword}&page=${pageNumber}`;
  if (category) url += `&category=${category}`;
  if (minPrice) url += `&minPrice=${minPrice}`;
  if (maxPrice) url += `&maxPrice=${maxPrice}`;
  if (color) url += `&color=${color}`;
  if (sort) url += `&sort=${sort}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await api.get('/products/featured');
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductsByCategory = async (slug) => {
  const response = await api.get(`/products/category/${slug}`);
  return response.data;
};

export const createProductReview = async (id, review) => {
  const response = await api.post(`/products/${id}/reviews`, review);
  return response.data;
};

export const getProductReviews = async (id) => {
  const response = await api.get(`/products/${id}/reviews`);
  return response.data;
};

export const getProductAiSummary = async (id) => {
  const response = await api.get(`/products/${id}/ai-summary`);
  return response.data;
};

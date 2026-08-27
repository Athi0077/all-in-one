let apiUrl = import.meta.env.VITE_API_URL || '';
// Remove trailing slashes and /api
const BASE_URL = apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/400';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // ensure leading slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
};

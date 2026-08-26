import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Filter, Search, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { Search as SearchIcon } from 'lucide-react';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const rating = searchParams.get('rating') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [data, categoriesData] = await Promise.all([
          getProducts(keyword, page, category, '', '', rating, sort),
          getCategories()
        ]);
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.total);
        setCategoriesList(categoriesData);
      } catch (error) {
        console.error('Error fetching products', error);
      }
      setLoading(false);
    };

    fetchProducts();
    window.scrollTo(0, 0);
  }, [keyword, page, category, sort, rating]);

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(location.search);
    if (newSort) params.set('sort', newSort);
    else params.delete('sort');
    params.set('page', '1');
    navigate(`/products?${params.toString()}`);
  };

  const handleFilterChange = (type, value) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set(type, value);
    else params.delete(type);
    params.set('page', '1');
    navigate(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    navigate('/products');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {keyword ? `Search Results for "${keyword}"` : category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'All Products'}
          </h1>
          <p className="text-gray-500 mt-1">Showing {products.length} of {total} products</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            className="md:hidden flex items-center justify-center gap-2 flex-1 border border-gray-300 rounded-lg py-2 px-4 font-medium"
            onClick={() => setShowMobileFilters(true)}
          >
            <Filter size={20} /> Filters
          </button>
          
          <select 
            value={sort} 
            onChange={handleSortChange}
            className="flex-1 md:w-48 border border-gray-300 rounded-lg py-2 px-4 focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">Sort By: Default</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="top_rated">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className={`w-full md:w-64 flex-shrink-0 ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
          {showMobileFilters && (
            <div className="flex justify-between items-center mb-6 md:hidden">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}><X size={24} /></button>
            </div>
          )}

          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Filters</h3>
              {(category || rating) && (
                <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear All</button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
              <div className="space-y-2">
                {categoriesList.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="category"
                      checked={category === cat.slug}
                      onChange={() => handleFilterChange('category', cat.slug)}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300" 
                    />
                    <span className={`text-sm ${category === cat.slug ? 'font-semibold text-primary' : 'text-gray-600'}`}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Rating</h4>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rate) => (
                  <label key={rate} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="rating"
                      checked={rating === rate.toString()}
                      onChange={() => handleFilterChange('rating', rate.toString())}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300" 
                    />
                    <span className={`text-sm flex items-center gap-1 ${rating === rate.toString() ? 'font-semibold text-primary' : 'text-gray-600'}`}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < rate ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      & Up
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {showMobileFilters && (
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-8"
              >
                Apply Filters
              </button>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => <ProductSkeleton key={n} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState 
              icon={SearchIcon}
              title="No products found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear Filters"
              actionLink="/products"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <button 
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {[...Array(pages).keys()].map(x => (
                      <button
                        key={x + 1}
                        onClick={() => handlePageChange(x + 1)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === x + 1 ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}
                      >
                        {x + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

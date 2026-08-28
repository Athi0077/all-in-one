import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Filter, Search, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { Search as SearchIcon } from 'lucide-react';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Brown', hex: '#8b4513' },
  { name: 'Cyan', hex: '#06b6d4' }
];

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
  const color = searchParams.get('color') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [data, categoriesData] = await Promise.all([
          getProducts(keyword, page, category, '', '', color, sort),
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
  }, [keyword, page, category, sort, color]);

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
              {(category || color) && (
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

            {/* Color Filter */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Color</h4>
              <div className="grid grid-cols-6 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleFilterChange('color', color === c.name ? '' : c.name)}
                    className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all ${color === c.name ? 'border-primary scale-110 shadow-md' : 'border-gray-200 hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Filter by ${c.name}`}
                  />
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

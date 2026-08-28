import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getImageUrl } from '../utils/getImageUrl';

const SearchBar = ({ onSearchCallback, placeholder = "Search products, categories...", className = "" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced API call for suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await getProducts(searchQuery, 1);
        // limit suggestions to top 5
        setSuggestions(response.products.slice(0, 5));
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching suggestions', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setShowDropdown(false);
      if (onSearchCallback) onSearchCallback();
    }
  };

  const handleSuggestionClick = () => {
    setShowDropdown(false);
    if (onSearchCallback) onSearchCallback();
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSearch} className="w-full relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </form>

      {/* Dropdown */}
      {showDropdown && (searchQuery.trim() !== '') && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center space-x-2">
               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
               <span>Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {suggestions.map((product) => (
                <li key={product._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <Link 
                    to={`/products/${product._id}`} 
                    className="flex items-center p-3"
                    onClick={handleSuggestionClick}
                  >
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden mr-4 border border-gray-200">
                      <img 
                        src={getImageUrl(product.images[0])} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-xs text-primary truncate">
                          in {typeof product.category === 'object' ? product.category.name : product.category}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

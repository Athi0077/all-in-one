import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PriceComparisonSearch from '../components/PriceComparisonSearch';
import PriceComparisonFilters from '../components/PriceComparisonFilters';
import PriceComparisonCard from '../components/PriceComparisonCard';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PriceComparisonPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('search') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const [sortBy, setSortBy] = useState('lowest_price');
  const [selectedStore, setSelectedStore] = useState('all');

  const fetchComparison = async (searchQuery) => {
    if (!searchQuery) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/price-comparison?search=${encodeURIComponent(searchQuery)}`);
      if (response.data && response.data.results) {
        setData(response.data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error("Error fetching comparison:", err);
      setError(err.response?.data?.message || 'Failed to fetch price comparison data.');
      toast.error('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchComparison(initialQuery);
    } else {
      setData(null);
    }
  }, [initialQuery]);

  const handleSearch = (query) => {
    setSearchParams({ search: query });
  };

  let displayedResults = [];
  let availableStores = [];
  let bestPrice = null;

  if (data && data.results) {
    availableStores = [...new Set(data.results.map(r => r.store))];
    
    displayedResults = [...data.results];

    // Filter
    if (selectedStore !== 'all') {
      displayedResults = displayedResults.filter(r => r.store === selectedStore);
    }

    // Sort
    displayedResults.sort((a, b) => {
      if (sortBy === 'lowest_price') return a.price - b.price;
      if (sortBy === 'highest_price') return b.price - a.price;
      if (sortBy === 'highest_discount') return b.discount - a.discount;
      return 0;
    });

    if (data.results.length > 0) {
        bestPrice = Math.min(...data.results.map(r => r.price));
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Compare Online Prices</h1>
          <p className="text-text-muted">Find the best deals across multiple stores instantly.</p>
        </div>

        <PriceComparisonSearch initialQuery={initialQuery} onSearch={handleSearch} />

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-surface rounded-xl border border-border h-48 sm:h-40 w-full"></div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center justify-center gap-3 border border-red-200">
            <AlertCircle size={24} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && !data && initialQuery === '' && (
          <div className="text-center py-20 bg-surface rounded-xl border border-border">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-text mb-2">Ready to Compare?</h2>
            <p className="text-text-muted">Enter a product name above to see prices across stores.</p>
          </div>
        )}

        {!loading && !error && data && data.results && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text">
                  Results for <span className="text-primary">"{data.productName}"</span>
                </h2>
                <p className="text-sm text-text-muted mt-1">Found {data.results.length} offers</p>
              </div>
              
              {bestPrice && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 p-2 rounded-full">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Best Price</p>
                    <p className="text-lg font-bold text-green-800">₹{bestPrice.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <PriceComparisonFilters 
              sortBy={sortBy} 
              setSortBy={setSortBy} 
              selectedStore={selectedStore} 
              setSelectedStore={setSelectedStore} 
              availableStores={availableStores}
            />

            {displayedResults.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-border">
                <p className="text-text-muted">No products found for the selected filters.</p>
                <button 
                  onClick={() => setSelectedStore('all')}
                  className="mt-4 text-primary hover:underline font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {displayedResults.map((result, index) => (
                  <PriceComparisonCard key={index} result={result} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PriceComparisonPage;

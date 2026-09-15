import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const PriceComparisonSearch = ({ initialQuery, onSearch }) => {
  const [query, setQuery] = useState(initialQuery || '');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a product to compare..."
          className="w-full py-4 pl-6 pr-16 rounded-full border-2 border-primary/20 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-lg shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors flex items-center justify-center shadow-md"
        >
          <Search size={24} />
        </button>
      </form>
    </div>
  );
};

export default PriceComparisonSearch;

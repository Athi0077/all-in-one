import React from 'react';

const PriceComparisonFilters = ({ sortBy, setSortBy, selectedStore, setSelectedStore, availableStores }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-surface p-4 rounded-xl border border-border shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-muted">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-background border border-border text-text text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 outline-none"
        >
          <option value="lowest_price">Lowest Price</option>
          <option value="highest_price">Highest Price</option>
          <option value="highest_discount">Highest Discount</option>
        </select>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
        <span className="text-sm font-medium text-text-muted whitespace-nowrap">Store:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              selectedStore === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-background border border-border text-text hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {availableStores.map(store => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedStore === store 
                  ? 'bg-primary text-white' 
                  : 'bg-background border border-border text-text hover:bg-gray-100'
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonFilters;

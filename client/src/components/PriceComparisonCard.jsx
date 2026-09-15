import React from 'react';
import { ExternalLink, Star } from 'lucide-react';

const PriceComparisonCard = ({ result }) => {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group">
      
      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <img 
                src={`https://logo.clearbit.com/${result.store.toLowerCase()}.com`} 
                alt={`${result.store} logo`}
                className="w-6 h-6 object-contain rounded-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{result.store}</span>
            </div>
            
            <div className="flex gap-2 items-center">
              {result.discount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {result.discount}% OFF
                </span>
              )}
              {result.rating && (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                  <span>{result.rating}</span>
                  <Star size={10} className="fill-current" />
                </div>
              )}
            </div>
          </div>
          
          <h3 className="font-medium text-text text-lg leading-tight mb-2 line-clamp-2">
            {result.title}
          </h3>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted mb-1">Current Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">₹{result.price.toLocaleString()}</span>
              {result.originalPrice && (
                <span className="text-sm text-text-muted line-through">₹{result.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
          
          <a 
            href={result.productUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto"
          >
            <span>View Deal</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PriceComparisonCard;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const ComparePricesButton = ({ productName }) => {
  const navigate = useNavigate();

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/price-comparison?search=${encodeURIComponent(productName)}`);
  };

  return (
    <button
      onClick={handleCompare}
      className="ml-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md shadow-sm"
      title="Compare prices across stores"
    >
      <Search size={14} />
      <span>Compare</span>
    </button>
  );
};

export default ComparePricesButton;

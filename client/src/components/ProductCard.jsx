import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { getImageUrl } from '../utils/getImageUrl';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const navigate = useNavigate();
  const [showQuickView, setShowQuickView] = React.useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isWished = isInWishlist(product._id);
  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const currentPrice = product.discountPrice || product.price;

  return (
    <div className="group bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 relative flex flex-col h-full">
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        {discountPercent > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercent}% OFF
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
            Featured
          </span>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm"
        >
          <Heart size={20} className={isWished ? "fill-red-500 text-red-500" : ""} />
        </button>
        {/* Quick View Button */}
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-primary transition-colors shadow-sm"
          title="Quick View"
        >
          <Eye size={20} />
        </button>
      </div>

      {/* Image */}
      <Link to={`/products/${product._id}`} className="block relative pt-[100%] overflow-hidden bg-gray-100">
        <img 
          src={getImageUrl(product.images?.[0])} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-text-muted mb-1">{product.brand}</div>
        <Link to={`/products/${product._id}`} className="block group-hover:text-primary transition-colors">
          <h3 className="font-semibold text-text line-clamp-2 mb-2 leading-tight">{product.name}</h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-text-muted">({product.numReviews})</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-lg font-bold text-text">${currentPrice.toFixed(2)}</span>
            {product.discountPrice > 0 && (
              <span className="text-xs sm:text-sm text-text-muted line-through">${product.price.toFixed(2)}</span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`p-2 rounded-lg flex-shrink-0 transition-colors ${product.stock > 0 ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>

      {showQuickView && (
        <QuickViewModal 
          product={product} 
          onClose={() => setShowQuickView(false)} 
        />
      )}
    </div>
  );
};

export default ProductCard;

import React, { useContext, useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { getImageUrl } from '../utils/getImageUrl';
import Button from './Button';
import toast from 'react-hot-toast';

const QuickViewModal = ({ product, onClose }) => {
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!product) return null;

  const isWished = isInWishlist(product._id);
  const currentPrice = product.discountPrice || product.price;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    addToCart(product, qty, selectedSize, activeImage);
    toast.success('Added to cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left: Images */}
        <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col items-center">
          <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden mb-4 border border-gray-100">
            <img 
              src={getImageUrl(product.images?.[activeImage])} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-contain p-4"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto w-full pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImage === idx ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
          <div className="mb-2">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">{product.brand}</span>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2">{product.name}</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200 fill-current'} />
              ))}
              <span className="text-gray-500 text-sm ml-2">({product.numReviews} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-black text-gray-900">${currentPrice.toFixed(2)}</span>
            {product.discountPrice > 0 && (
              <span className="text-lg text-gray-400 line-through">${product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{product.description}</p>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-900">Select Size</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 min-w-[2.5rem] px-3 rounded-lg border-2 font-bold text-sm transition-all ${selectedSize === size ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 text-gray-700 hover:border-primary'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 h-12">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 text-gray-600 hover:text-primary transition-colors h-full"
                >-</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button 
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-4 text-gray-600 hover:text-primary transition-colors h-full"
                  disabled={qty >= product.stock}
                >+</button>
              </div>
              <Button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 h-12 rounded-xl text-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => toggleWishlist(product)}
                className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-colors ${isWished ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Heart size={20} className={isWished ? 'fill-current' : ''} />
                {isWished ? 'Saved' : 'Wishlist'}
              </button>
              <Link 
                to={`/products/${product._id}`}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center font-semibold transition-colors"
                onClick={onClose}
              >
                Full Details
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuickViewModal;

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, createProductReview, getProductReviews, getProductAiSummary } from '../services/productService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { ShieldCheck, Truck, RotateCcw, Heart, Share2, Star, Minus, Plus, MessageSquare, Sparkles } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const [productData, reviewsData] = await Promise.all([
          getProductById(id),
          getProductReviews(id)
        ]);
        setProduct(productData);
        setReviews(reviewsData);
        document.title = `${productData.name} | All-in-One Store`;
      } catch (error) {
        toast.error('Product not found');
        navigate('/products');
      }
      setLoading(false);
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success('Added to cart');
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!rating || !comment) {
      toast.error('Please provide both rating and comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await createProductReview(id, { rating, comment });
      toast.success('Review submitted successfully!');
      setRating(5);
      setComment('');
      // Refresh product to get updated stats
      const [productData, reviewsData] = await Promise.all([
        getProductById(id),
        getProductReviews(id)
      ]);
      setProduct(productData);
      setReviews(reviewsData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const handleAskAi = async () => {
    if (aiSummary) return; // Already fetched
    setLoadingAi(true);
    try {
      const data = await getProductAiSummary(id);
      setAiSummary(data.summary);
    } catch (error) {
      toast.error('Failed to get AI summary');
    }
    setLoadingAi(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 h-[500px] bg-gray-200 animate-pulse rounded-2xl"></div>
          <div className="w-full md:w-1/2 space-y-6">
            <div className="h-10 bg-gray-200 animate-pulse rounded-md w-3/4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded-md w-1/4"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded-md w-full"></div>
            <div className="h-12 bg-gray-200 animate-pulse rounded-md w-1/3"></div>
            <div className="h-12 bg-gray-200 animate-pulse rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const isWished = isInWishlist(product._id);
  const currentPrice = product.discountPrice || product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-8" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/" className="text-gray-500 hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <Link to="/products" className="text-gray-500 hover:text-primary transition-colors">Products</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          {product.category && (
            <li className="flex items-center">
              <Link to={`/products?category=${product.category.slug}`} className="text-gray-500 hover:text-primary transition-colors">{product.category.name}</Link>
              <span className="mx-2 text-gray-400">/</span>
            </li>
          )}
          <li className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Product Images */}
        <div className="w-full lg:w-1/2">
          <div className="bg-gray-100 rounded-3xl overflow-hidden mb-4 relative aspect-square">
            <img 
              src={getImageUrl(product.images[activeImage])} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${activeImage === idx ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={getImageUrl(img)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-primary tracking-wider uppercase">{product.brand}</span>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-900 p-2"><Share2 size={20} /></button>
              <button 
                className="text-gray-400 hover:text-red-500 p-2"
                onClick={() => toggleWishlist(product)}
              >
                <Heart size={20} className={isWished ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300 fill-current'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.numReviews} Reviews)</span>
            <span className="text-gray-300">|</span>
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="mb-8">
            <span className="text-4xl font-black text-gray-900">${currentPrice.toFixed(2)}</span>
            {product.discountPrice > 0 && (
              <span className="ml-3 text-xl text-gray-500 line-through">${product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            {product.description}
          </p>

          {/* AI Summary Section */}
          <div className="mb-8">
            {!aiSummary ? (
              <Button 
                variant="outline" 
                className="rounded-xl flex items-center gap-2 border-primary text-primary hover:bg-primary/5"
                onClick={handleAskAi}
                isLoading={loadingAi}
              >
                <Sparkles size={18} /> Ask AI about this product
              </Button>
            ) : (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex gap-3 items-start">
                <Sparkles size={24} className="text-primary shrink-0 mt-1" />
                <p className="text-gray-700 italic leading-relaxed text-sm">
                  "{aiSummary}"
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-b border-gray-100 py-6 mb-8 flex flex-col sm:flex-row gap-6">
            {/* Quantity Selector */}
            <div className="flex items-center">
              <span className="mr-4 font-semibold text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-full">
                <button 
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button 
                  onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="p-3 text-gray-500 hover:text-gray-900 transition-colors"
                  disabled={qty >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button 
              size="lg" 
              className="flex-1 rounded-full text-lg font-bold"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gray-50 rounded-full text-gray-900"><Truck size={20} /></div>
              <div>
                <p className="font-semibold text-sm">Free Delivery</p>
                <p className="text-xs">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gray-50 rounded-full text-gray-900"><RotateCcw size={20} /></div>
              <div>
                <p className="font-semibold text-sm">30 Days Return</p>
                <p className="text-xs">No questions asked</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gray-50 rounded-full text-gray-900"><ShieldCheck size={20} /></div>
              <div>
                <p className="font-semibold text-sm">Secure Payment</p>
                <p className="text-xs">100% secure checkout</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-gray-200 pt-16" id="reviews">
        <div className="flex flex-col md:flex-row gap-12">
           <div className="w-full md:w-1/3">
             <h2 className="text-2xl font-black text-gray-900 mb-6">Customer Reviews</h2>
             <div className="bg-gray-50 rounded-2xl p-8 text-center mb-8">
               <div className="text-5xl font-black text-gray-900 mb-4">{product.rating.toFixed(1)}</div>
               <div className="flex justify-center items-center text-yellow-400 mb-2">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} size={24} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300 fill-current'} />
                 ))}
               </div>
               <p className="text-gray-500">Based on {product.numReviews} reviews</p>
             </div>
             
             {user ? (
               <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   <MessageSquare size={20} className="text-primary"/> Write a Review
                 </h3>
                 <form onSubmit={submitReviewHandler} className="space-y-4">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                     <select 
                       value={rating} 
                       onChange={(e) => setRating(Number(e.target.value))}
                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                     >
                       <option value="5">5 - Excellent</option>
                       <option value="4">4 - Very Good</option>
                       <option value="3">3 - Good</option>
                       <option value="2">2 - Fair</option>
                       <option value="1">1 - Poor</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Comment</label>
                     <textarea 
                       rows="4" 
                       value={comment}
                       onChange={(e) => setComment(e.target.value)}
                       placeholder="What did you like or dislike?"
                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                       required
                     ></textarea>
                   </div>
                   <Button type="submit" isLoading={submittingReview} className="w-full rounded-xl">Submit Review</Button>
                 </form>
               </div>
             ) : (
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                 <p className="text-blue-800 mb-4 font-medium">Please login to write a review</p>
                 <Link to={`/login?redirect=/products/${id}`}>
                   <Button variant="outline" className="w-full rounded-xl border-blue-200 text-blue-700 hover:bg-blue-100">Login Now</Button>
                 </Link>
               </div>
             )}
           </div>
           
           <div className="w-full md:w-2/3">
             <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Reviews</h3>
             <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{review.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} className={i < review.rating ? 'fill-current' : 'text-gray-200 fill-current'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm">{review.comment}</p>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;

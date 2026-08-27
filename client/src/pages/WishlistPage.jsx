import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { ProductSkeleton } from '../components/Skeleton';

const WishlistPage = () => {
  const { wishlist, loading } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/wishlist');
    }
  }, [user, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-red-100 text-red-500 p-3 rounded-xl">
          <Heart size={28} className="fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Wishlist</h1>
          <p className="text-gray-500 mt-1">{wishlist?.length || 0} items saved</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(n => <ProductSkeleton key={n} />)}
        </div>
      ) : wishlist && wishlist.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love and buy them later."
          actionLabel="Explore Products"
          actionLink="/products"
        />
      )}
    </div>
  );
};

export default WishlistPage;

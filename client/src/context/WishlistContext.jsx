import { createContext, useState, useEffect, useContext } from 'react';
import { getWishlist, toggleWishlist as toggleWishlistService } from '../services/wishlistService';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await getWishlist();
      setWishlist(data);
    } catch (error) {
      console.error('Error fetching wishlist', error);
    }
    setLoading(false);
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      // Could potentially manage local wishlist here, but requiring login is better
      alert('Please login to add to wishlist');
      return;
    }
    
    // Optimistic update
    const isLiked = wishlist.find(p => p._id === product._id);
    if (isLiked) {
      setWishlist(prev => prev.filter(p => p._id !== product._id));
    } else {
      setWishlist(prev => [...prev, product]);
    }

    try {
      const updatedWishlist = await toggleWishlistService(product._id);
      setWishlist(updatedWishlist);
    } catch (error) {
      console.error('Error toggling wishlist', error);
      // Revert optimistic update by refetching
      fetchWishlist();
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(p => p._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

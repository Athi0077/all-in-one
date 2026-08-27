import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, Menu, X, LogOut, Package, Settings } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { cartCount } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const { user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setIsMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
              AllinOne<span className="text-text">.</span>
            </Link>
          </div>

          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <form onSubmit={handleSearch} className="w-full max-w-lg relative">
              <input
                type="text"
                placeholder="Search products, categories..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </form>
            <nav className="ml-8 flex space-x-6">
              <Link to="/products" className="text-text-muted hover:text-primary font-medium transition-colors">Shop</Link>
              <Link to="/products?category=mens" className="text-text-muted hover:text-primary font-medium transition-colors">Mens</Link>
              <Link to="/products?category=womens" className="text-text-muted hover:text-primary font-medium transition-colors">Womens</Link>
              <Link to="/products?category=kids" className="text-text-muted hover:text-primary font-medium transition-colors">Kids</Link>
            </nav>
          </div>

          {/* Desktop Right Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/wishlist" className="text-text-muted hover:text-primary transition-colors relative">
              <Heart size={24} />
              {wishlist?.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            <Link to="/cart" className="text-text-muted hover:text-primary transition-colors relative">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-text-muted hover:text-primary transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border py-2 z-50">
                    <div className="px-4 py-2 border-b border-border mb-2">
                      <p className="text-sm font-bold text-text truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50 transition-colors">
                      <User size={16} className="mr-2 text-gray-400" /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50 transition-colors">
                      <Package size={16} className="mr-2 text-gray-400" /> My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-sm text-text hover:bg-gray-50 transition-colors">
                        <Settings size={16} className="mr-2 text-gray-400" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                      <LogOut size={16} className="mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-5 py-2 rounded-full transition-colors">
                Log In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="text-text hover:text-primary transition-colors relative">
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text hover:text-primary focus:outline-none"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface border-t border-border absolute w-full">
          <div className="px-4 pt-4 pb-6 space-y-4 shadow-xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-primary outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </form>
            
            <div className="flex flex-col space-y-2">
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">Shop All</Link>
              <Link to="/products?category=mens" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">Mens</Link>
              <Link to="/products?category=womens" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">Womens</Link>
              <Link to="/products?category=kids" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">Kids</Link>
            </div>

            <div className="border-t border-border pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 mb-2">
                    <p className="text-base font-bold text-text">{user.name}</p>
                    <p className="text-sm text-text-muted">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">
                    <User size={20} className="mr-3 text-gray-400" /> My Profile
                  </Link>
                  <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">
                    <Heart size={20} className="mr-3 text-gray-400" /> Wishlist ({wishlist?.length || 0})
                  </Link>
                  <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">
                    <Package size={20} className="mr-3 text-gray-400" /> My Orders
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-3 text-base font-medium text-text rounded-lg hover:bg-gray-50">
                      <Settings size={20} className="mr-3 text-gray-400" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-base font-medium text-red-600 rounded-lg hover:bg-red-50 text-left">
                    <LogOut size={20} className="mr-3" /> Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 px-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-3 border border-border text-text font-medium rounded-xl">
                    Log In
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-xl">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, RefreshCw, CreditCard, ArrowRight, Package } from 'lucide-react';
import { getFeaturedProducts, getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { ProductSkeleton } from '../components/Skeleton';
import Button from '../components/Button';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [featuredRes, categoriesRes, trendingRes] = await Promise.all([
          getFeaturedProducts(),
          getCategories(),
          getProducts('', 1, '', '', '', '', 'top_rated')
        ]);
        setFeaturedProducts(featuredRes);
        setCategories(categoriesRes.slice(0, 8)); // Take up to 8 categories
        setTrendingProducts(trendingRes.products.slice(0, 4));
      } catch (error) {
        console.error('Error fetching home data', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-48 flex flex-col justify-center min-h-[80vh]">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-semibold mb-6 backdrop-blur-sm">
              New Collection 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              Everything You Want. <br/><span className="text-primary">All in One Place.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-xl leading-relaxed">
              Discover millions of products across fashion, electronics, home essentials, and more. Premium quality at unbeatable prices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="rounded-full font-bold text-lg px-8 py-4">Shop Now</Button>
              </Link>
              <Link to="/products?sort=newest">
                <Button variant="outline" size="lg" className="rounded-full font-bold text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-gray-900">
                  Explore New
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Package size={28} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Wide Collection</h4>
              <p className="text-sm text-gray-500">Millions of products across all categories</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={28} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
              <p className="text-sm text-gray-500">100% secure payment processing</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <Truck size={28} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Fast Delivery</h4>
              <p className="text-sm text-gray-500">Free delivery on orders over $50</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                <RefreshCw size={28} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Easy Returns</h4>
              <p className="text-sm text-gray-500">30-day return policy for all items</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Shop by Category</h2>
              <p className="text-gray-500 mt-2">Explore our wide range of collections</p>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="bg-gray-200 animate-pulse rounded-2xl aspect-[4/5] sm:aspect-square"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map(category => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Featured Products</h2>
              <p className="text-gray-500 mt-2">Hand-picked items just for you</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center text-primary font-semibold hover:text-primary-hover group">
              View All <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              [1, 2, 3, 4].map(n => <ProductSkeleton key={n} />)
            ) : (
              featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/products">
              <Button variant="outline" className="w-full rounded-full">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center min-h-[400px]">
            <div className="absolute inset-0 w-full h-full md:w-1/2 md:right-0 md:left-auto">
              <img 
                src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&q=80&w=1000" 
                alt="Promo" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
            </div>
            
            <div className="relative z-10 p-8 md:p-16 md:w-1/2 flex flex-col justify-center text-left">
              <span className="text-secondary font-bold tracking-wider uppercase mb-2">Limited Time Offer</span>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
                Up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-blue-400">50% OFF</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-md">
                Don't miss out on our exclusive deals across electronics and fashion. Upgrade your lifestyle today.
              </p>
              <div>
                <Link to="/products?sort=price_asc">
                  <Button size="lg" className="rounded-full px-8 bg-white text-gray-900 hover:bg-gray-100 hover:text-black">Explore Deals</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">Trending Now</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Discover the most popular products our customers are loving right now.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              [1, 2, 3, 4].map(n => <ProductSkeleton key={n} />)
            ) : (
              trendingProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white opacity-10"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Join Our Newsletter</h2>
          <p className="text-primary-100 text-lg mb-10 text-white/80">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
          
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="flex-1 px-6 py-4 rounded-full border-none focus:ring-4 focus:ring-white/20 outline-none text-gray-900 placeholder-gray-500"
              required
            />
            <Button size="lg" className="rounded-full bg-gray-900 text-white hover:bg-gray-800 px-8 py-4 shrink-0 shadow-lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

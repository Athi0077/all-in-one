import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

const CartPage = () => {
  const { cartItems, updateQty, removeFromCart, cartTotal } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const checkoutHandler = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState 
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Start Shopping"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-6 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-500">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={item.product} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-6 items-center">
                  {/* Product Info */}
                  <div className="col-span-1 sm:col-span-6 flex gap-4 items-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-100"
                    />
                    <div>
                      <Link to={`/products/${item.product}`} className="font-semibold text-gray-900 hover:text-primary transition-colors text-base sm:text-lg line-clamp-2">
                        {item.name}
                      </Link>
                      <p className="text-gray-500 mt-1 sm:hidden">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-1 sm:col-span-3 flex justify-start sm:justify-center">
                    <div className="flex items-center border border-gray-300 rounded-full">
                      <button 
                        onClick={() => updateQty(item.product, Math.max(1, item.qty - 1))}
                        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.product, Math.min(item.stock, item.qty + 1))}
                        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                        disabled={item.qty >= item.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="hidden sm:block col-span-2 text-right font-bold text-gray-900">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                  
                  {/* Remove */}
                  <div className="col-span-1 sm:col-span-1 flex justify-end">
                    <button 
                      onClick={() => removeFromCart(item.product)}
                      className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span className="font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-900 text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full rounded-xl h-14 text-lg font-bold"
              onClick={checkoutHandler}
            >
              Proceed to Checkout
            </Button>
            
            <div className="mt-4 text-center">
              <Link to="/products" className="text-sm font-medium text-primary hover:underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

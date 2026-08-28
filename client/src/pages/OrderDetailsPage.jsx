import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getOrderDetails, cancelOrder } from '../services/orderService';
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, ArrowLeft, XCircle, Star, Check } from 'lucide-react';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?redirect=/orders/${id}`);
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await getOrderDetails(id);
        setOrder(data);
      } catch (error) {
        toast.error('Order not found or unauthorized');
        navigate('/orders');
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id, user, navigate, authLoading]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing': return <Clock size={20} className="text-yellow-500" />;
      case 'Shipped': return <Truck size={20} className="text-blue-500" />;
      case 'Delivered': return <CheckCircle size={20} className="text-green-500" />;
      case 'Cancelled': return <XCircle size={20} className="text-red-500" />;
      default: return <Clock size={20} className="text-gray-500" />;
    }
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setCancelling(true);
      try {
        await cancelOrder(id);
        toast.success('Order cancelled successfully');
        const data = await getOrderDetails(id);
        setOrder(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel order');
      }
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 animate-pulse rounded-2xl"></div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-2xl"></div>
          </div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Orders
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Details</h1>
          <p className="text-gray-500 mt-1">Order #{order._id}</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          {getStatusIcon(order.orderStatus)}
          <span className="font-bold text-gray-700">{order.orderStatus}</span>
        </div>
      </div>

      {/* Visual Status Timeline */}
      {order.orderStatus !== 'Cancelled' && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm overflow-x-auto hide-scrollbar">
          <div className="min-w-[600px]">
            <div className="flex items-center justify-between relative">
              {/* Background Line */}
              <div className="absolute left-0 top-4 w-full h-1 bg-gray-100 rounded-full"></div>
              {/* Active Line */}
              <div 
                 className="absolute left-0 top-4 h-1 bg-primary rounded-full transition-all duration-500"
                 style={{ 
                   width: `${
                     ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'].indexOf(order.orderStatus) === -1 
                       ? 0 
                       : (['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'].indexOf(order.orderStatus) / 5) * 100
                   }%` 
                 }}
              ></div>
              
              {['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'].map((status, idx) => {
                const currentIndex = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'].indexOf(order.orderStatus);
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                return (
                  <div key={status} className="relative z-10 flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${
                      isCompleted ? 'bg-primary border-primary text-white shadow-md shadow-primary/30' : 'bg-white border-gray-200 text-gray-300'
                    } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>}
                    </div>
                    <span className={`mt-4 text-xs font-black uppercase tracking-wider ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Items & Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items List */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Package size={20} className="mr-2 text-primary" /> Items Ordered
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                  <div className="flex-1">
                    <Link to={`/products/${item.product}`} className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.name}
                    </Link>
                    {item.size && (
                      <p className="text-sm text-gray-500 mb-1">Size: {item.size}</p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                  </div>
                  <div className="text-right font-bold text-gray-900 whitespace-nowrap flex flex-col items-end gap-2">
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                    {order.orderStatus === 'Delivered' && (
                       <Link to={`/products/${item.product}#reviews`} className="text-xs text-primary font-medium flex items-center hover:underline">
                          <Star size={12} className="mr-1" /> Write Review
                       </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <MapPin size={20} className="mr-2 text-primary" /> Shipping Address
                </h2>
              </div>
              <div className="p-6">
                <p className="font-medium text-gray-900 mb-1">{order.user.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {order.shippingAddress?.street || order.shippingAddress?.address}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.postalCode || order.shippingAddress?.zipCode}<br />
                  {order.shippingAddress?.country}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <CreditCard size={20} className="mr-2 text-primary" /> Payment Method
                </h2>
              </div>
              <div className="p-6 flex flex-col h-full justify-center">
                <p className="font-medium text-gray-900">{order.paymentMethod}</p>
                <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-max ${
                  order.paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="mb-6 p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">Order Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(order.orderStatus)}
                <span className="font-bold text-gray-900">{order.orderStatus}</span>
              </div>
            </div>
            
            <div className="space-y-4 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-gray-900">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">${order.shippingCharge.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">${order.total.toFixed(2)}</span>
            </div>

            {order.orderStatus === 'Processing' && (
              <div className="bg-blue-50 p-4 rounded-xl text-blue-700 text-sm mb-4">
                Your order is currently being processed and will ship soon.
              </div>
            )}
            
            {order.orderStatus === 'Cancelled' && (
              <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm mb-4">
                This order has been cancelled.
              </div>
            )}
            
            {order.orderStatus === 'Pending' && (
              <Button 
                 variant="outline" 
                 className="w-full rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                 onClick={handleCancelOrder}
                 isLoading={cancelling}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;

import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyOrders } from '../services/orderService';
import { Package, ExternalLink, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { getImageUrl } from '../utils/getImageUrl';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders', error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, navigate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing': return <Clock size={16} className="text-yellow-500" />;
      case 'Shipped': return <Truck size={16} className="text-blue-500" />;
      case 'Delivered': return <CheckCircle size={16} className="text-green-500" />;
      case 'Cancelled': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState 
          icon={Package}
          title="No orders yet"
          description="You haven't placed any orders. Start exploring our collection!"
          actionLabel="Start Shopping"
          actionLink="/products"
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Placed</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total</p>
                    <p className="text-sm font-medium text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Order #</p>
                    <p className="text-sm font-medium text-gray-900">{order._id}</p>
                  </div>
                </div>
                <div>
                  <Link 
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex -space-x-4">
                    {order.items.slice(0, 3).map((item, index) => (
                      <img 
                        key={index} 
                        src={getImageUrl(item.image)} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm relative z-[index]"
                        style={{ zIndex: 3 - index }}
                      />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-sm font-bold text-gray-500 relative z-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {order.items.length === 1 ? order.items[0].name : `${order.items[0].name} and ${order.items.length - 1} other item(s)`}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      Deliver to: {order.shippingAddress.city}, {order.shippingAddress.country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

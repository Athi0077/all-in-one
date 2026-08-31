import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { updateOrderStatus } from '../../services/adminService';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, Truck, CheckCircle } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/getImageUrl';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
        setCurrentStatus(data.orderStatus);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load order details');
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setStatusUpdating(true);
    try {
      await updateOrderStatus(id, currentStatus);
      toast.success('Order status updated');
      setOrder(prev => ({ ...prev, orderStatus: currentStatus }));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
    setStatusUpdating(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Processing': return <Clock size={20} className="text-yellow-500" />;
      case 'Shipped': return <Truck size={20} className="text-blue-500" />;
      case 'Delivered': return <CheckCircle size={20} className="text-green-500" />;
      default: return <Clock size={20} className="text-gray-500" />;
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/orders" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order #{order.orderId || order._id.substring(0, 8)}</h1>
          <p className="text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Package size={20} className="mr-2 text-primary" /> Ordered Items
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-6 flex items-center gap-4">
                  <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.qty} × ${item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right font-bold text-gray-900">
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <MapPin size={20} className="mr-2 text-primary" /> Shipping Info
                </h2>
              </div>
              <div className="p-6">
                <p className="font-bold text-gray-900 mb-1">{order.user?.name || 'Guest'}</p>
                <p className="text-sm text-gray-500 mb-4">{order.user?.email}</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <CreditCard size={20} className="mr-2 text-primary" /> Payment Status
                </h2>
              </div>
              <div className="p-6 flex flex-col h-full justify-center">
                <p className="font-medium text-gray-900 mb-2">Method: {order.paymentMethod}</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold w-max ${
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

        {/* Sidebar Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-6">
              <div className="flex justify-between"><span>Items Subtotal</span><span className="font-medium text-gray-900">${order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-medium text-gray-900">${order.shippingCharge.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-gray-900">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Update Status</h2>
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
              {getStatusIcon(order.orderStatus)}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Current Status</p>
                <p className="font-bold text-gray-900">{order.orderStatus}</p>
              </div>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">New Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <Button type="submit" className="w-full rounded-xl" isLoading={statusUpdating} disabled={currentStatus === order.orderStatus}>
                Update Order Status
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

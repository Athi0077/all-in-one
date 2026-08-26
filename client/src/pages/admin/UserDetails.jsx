import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminUserById } from '../../services/adminService';
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const UserDetails = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getAdminUserById(id);
        setUserData(data);
      } catch (error) {
        toast.error('Failed to load user details');
      }
      setLoading(false);
    };

    fetchUser();
  }, [id]);

  if (loading) return <div className="p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!userData || !userData.user) return <div className="p-8 text-center text-gray-500">User not found.</div>;

  const { user, orders } = userData;
  const totalSpent = orders.reduce((acc, order) => acc + order.total, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/users" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.role}</p>
            
            <div className="space-y-3 text-left border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" /> {user.phone}
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" /> {user.address}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Account Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Joined</span>
                <span className="text-sm font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Orders</span>
                <span className="text-sm font-medium text-gray-900">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Spent</span>
                <span className="text-lg font-bold text-gray-900">${totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <ShoppingBag size={20} className="mr-2 text-primary" /> Order History
              </h2>
              <span className="text-sm text-gray-500">{orders.length} Orders</span>
            </div>
            
            {orders.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex-1 flex flex-col items-center justify-center">
                <ShoppingBag size={48} className="text-gray-300 mb-4" />
                <p>This user hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                {orders.map(order => (
                  <div key={order._id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <Link to={`/admin/orders/${order._id}`} className="font-bold text-gray-900 hover:text-primary transition-colors">
                        #{order._id.substring(0, 8)}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{order.items.length} items</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

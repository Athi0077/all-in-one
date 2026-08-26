import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Shield } from 'lucide-react';

const ProfilePage = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addresses: [],
    password: '',
    confirmPassword: '',
  });
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '', addressType: 'Home', isDefault: false });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          addresses: data.addresses || [],
          password: '',
          confirmPassword: '',
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const updatedUser = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        addresses: formData.addresses,
        password: formData.password || undefined,
      });
      setUser(updatedUser.data);
      toast.success('Profile updated successfully');
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-64 bg-gray-200 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">My Profile</h1>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Profile Header */}
        <div className="bg-primary/5 border-b border-gray-200 p-8 flex items-center gap-6">
          <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-bold">
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
            <p className="text-gray-500">{formData.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <User size={20} className="text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <MapPin size={20} className="text-primary" /> Saved Addresses
               </h3>
               <Button type="button" onClick={() => setIsAddingAddress(!isAddingAddress)} variant="outline" size="sm">
                 {isAddingAddress ? 'Cancel' : 'Add New Address'}
               </Button>
            </div>
            
            {isAddingAddress && (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-2 md:col-span-1"><Input label="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} /></div>
                 <div className="col-span-2 md:col-span-1"><Input label="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} /></div>
                 <div className="col-span-2"><Input label="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} /></div>
                 <div className="col-span-2 md:col-span-1"><Input label="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} /></div>
                 <div className="col-span-2 md:col-span-1"><Input label="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} /></div>
                 <div className="col-span-2 md:col-span-1"><Input label="Zip Code" value={newAddress.zipCode} onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})} /></div>
                 <div className="col-span-2 md:col-span-1"><Input label="Country" value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} /></div>
                 <div className="col-span-2 flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="w-4 h-4 text-primary" />
                       <span className="text-sm">Set as default</span>
                    </label>
                    <Button type="button" onClick={() => {
                        const newAddrs = [...formData.addresses];
                        if (newAddress.isDefault) newAddrs.forEach(a => a.isDefault = false);
                        newAddrs.push(newAddress);
                        setFormData({...formData, addresses: newAddrs});
                        setNewAddress({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '', addressType: 'Home', isDefault: false });
                        setIsAddingAddress(false);
                    }}>Save Address</Button>
                 </div>
              </div>
            )}

            {formData.addresses.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {formData.addresses.map((addr, idx) => (
                   <div key={idx} className="p-4 border border-gray-200 rounded-xl relative group">
                     {addr.isDefault && <span className="absolute top-2 right-2 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Default</span>}
                     <p className="font-bold text-gray-900">{addr.fullName}</p>
                     <p className="text-sm text-gray-500 mb-2">{addr.phone}</p>
                     <p className="text-sm text-gray-700">{addr.street}, {addr.city}</p>
                     <p className="text-sm text-gray-700">{addr.state} {addr.zipCode}, {addr.country}</p>
                     
                     <div className="mt-4 flex gap-2">
                        <button type="button" className="text-sm text-red-500 hover:underline" onClick={() => {
                           const newAddrs = [...formData.addresses];
                           newAddrs.splice(idx, 1);
                           setFormData({...formData, addresses: newAddrs});
                        }}>Remove</button>
                        {!addr.isDefault && (
                          <button type="button" className="text-sm text-primary hover:underline" onClick={() => {
                             const newAddrs = [...formData.addresses];
                             newAddrs.forEach(a => a.isDefault = false);
                             newAddrs[idx].isDefault = true;
                             setFormData({...formData, addresses: newAddrs});
                          }}>Make Default</button>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
               <p className="text-gray-500 text-sm">No addresses saved yet.</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Shield size={20} className="text-primary" /> Security
            </h3>
            <p className="text-sm text-gray-500 mb-4">Leave password fields empty if you don't want to change it.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="New Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex justify-end">
            <Button type="submit" size="lg" className="rounded-xl px-8" isLoading={updating}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

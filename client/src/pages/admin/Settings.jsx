import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/adminService';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Store, Truck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    phone: '',
    address: '',
    defaultShippingCharge: 0,
    freeShippingThreshold: 0,
    lowStockThreshold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings({
          storeName: data.storeName || '',
          storeDescription: data.storeDescription || '',
          contactEmail: data.contactEmail || '',
          phone: data.phone || '',
          address: data.address || '',
          defaultShippingCharge: data.defaultShippingCharge || 0,
          freeShippingThreshold: data.freeShippingThreshold || 0,
          lowStockThreshold: data.lowStockThreshold || 0,
        });
      } catch (error) {
        toast.error('Failed to load settings');
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Store Settings</h1>
        <p className="text-gray-500 mt-1">Manage global configuration for your store.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Store size={20} className="text-primary" /> Store Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Store Name" name="storeName" value={settings.storeName} onChange={handleChange} required />
            <Input label="Contact Email" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleChange} required />
            <div className="md:col-span-2">
              <Input label="Store Description" name="storeDescription" value={settings.storeDescription} onChange={handleChange} />
            </div>
            <Input label="Phone Number" name="phone" value={settings.phone} onChange={handleChange} />
            <Input label="Physical Address" name="address" value={settings.address} onChange={handleChange} />
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <Truck size={20} className="text-primary" /> Shipping Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Default Shipping Charge ($)" 
              name="defaultShippingCharge" 
              type="number" 
              min="0" 
              step="0.01" 
              value={settings.defaultShippingCharge} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Free Shipping Threshold ($)" 
              name="freeShippingThreshold" 
              type="number" 
              min="0" 
              step="0.01" 
              value={settings.freeShippingThreshold} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <AlertTriangle size={20} className="text-primary" /> Inventory Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Low Stock Threshold (Quantity)" 
              name="lowStockThreshold" 
              type="number" 
              min="0" 
              value={settings.lowStockThreshold} 
              onChange={handleChange} 
              required 
            />
          </div>
          <p className="text-sm text-gray-500">You will see an alert on the dashboard if any product stock falls to or below this number.</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="rounded-xl px-8 py-3 font-bold" isLoading={saving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

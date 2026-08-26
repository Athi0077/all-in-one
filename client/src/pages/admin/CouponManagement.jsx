import React, { useEffect, useState } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/adminService';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    discountType: 'Percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    startDate: '',
    expiryDate: '',
    usageLimit: 100,
    isActive: true
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error('Failed to load coupons');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({
      id: '', code: '', discountType: 'Percentage', discountValue: 0, 
      minOrderAmount: 0, maxDiscount: 0, startDate: '', expiryDate: '', 
      usageLimit: 100, isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setIsEdit(true);
    setFormData({
      id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount || 0,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateCoupon(formData.id, formData);
        toast.success('Coupon updated');
      } else {
        await createCoupon(formData);
        toast.success('Coupon created');
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted');
      setDeleteConfirm(null);
      fetchCoupons();
    } catch (error) {
      toast.error('Error deleting coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Coupons</h1>
          <p className="text-gray-500 mt-1">Manage discount codes and promotions.</p>
        </div>
        <Button onClick={openCreateModal} className="rounded-xl flex items-center gap-2">
          <Plus size={20} /> Create Coupon
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                <th className="py-4 px-6 font-medium whitespace-nowrap">Code</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Discount</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Valid Until</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Usage</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Status</th>
                <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <Tag size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No coupons active</p>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{coupon.code}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{coupon.usedCount} / {coupon.usageLimit}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(coupon)} className="p-2 text-gray-400 hover:text-primary"><Edit size={16} /></button>
                        <button onClick={() => setDeleteConfirm(coupon._id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Coupon Code" name="code" value={formData.code} onChange={handleChange} required />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Discount Type</label>
                  <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-primary">
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed Amount">Fixed Amount</option>
                  </select>
                </div>
                <Input label="Discount Value" name="discountValue" type="number" value={formData.discountValue} onChange={handleChange} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Min Order Amount" name="minOrderAmount" type="number" value={formData.minOrderAmount} onChange={handleChange} />
                <Input label="Max Discount (Optional)" name="maxDiscount" type="number" value={formData.maxDiscount} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                <Input label="Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} required />
              </div>

              <Input label="Usage Limit" name="usageLimit" type="number" value={formData.usageLimit} onChange={handleChange} />

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-primary rounded" />
                <span className="font-medium text-gray-900">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">{isEdit ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Coupon</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this coupon?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;

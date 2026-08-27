import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { createCategory, updateCategory, deleteCategory, uploadImage } from '../../services/adminService';
import { Plus, Edit, Trash2, FolderTree, Upload, X } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/getImageUrl';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setUploading(true);
    try {
      const imagePath = await uploadImage(form);
      setFormData(prev => ({ ...prev, image: imagePath }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Image upload failed');
    }
    setUploading(false);
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({ id: '', name: '', slug: '', description: '', image: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setIsEdit(true);
    setFormData({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image || '',
      isActive: cat.isActive !== undefined ? cat.isActive : true
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
        await updateCategory(formData.id, formData);
        toast.success('Category updated');
      } else {
        await createCategory(formData);
        toast.success('Category created');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting category');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories.</p>
        </div>
        <Button onClick={openCreateModal} className="rounded-xl flex items-center gap-2">
          <Plus size={20} /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                <th className="py-4 px-6 font-medium">Category Name</th>
                <th className="py-4 px-6 font-medium">Slug</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500">
                    <FolderTree size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No categories found</p>
                  </td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img src={getImageUrl(cat.image)} alt={cat.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                            <FolderTree size={16} />
                          </div>
                        )}
                        <span className="font-bold text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{cat.slug}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {cat.isActive !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(cat)}
                          className="p-2 text-gray-400 hover:text-primary bg-white hover:bg-primary/10 rounded-lg transition-colors border border-gray-200 hover:border-primary/20"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(cat._id)}
                          className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Category' : 'Create Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Name</label>
                <select 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: value,
                      slug: value.toLowerCase().replace(/ /g, '-')
                    }));
                  }}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Mens">Mens</option>
                  <option value="Womens">Womens</option>
                  <option value="Kids">Kids</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home Appliance">Home Appliance</option>
                  <option value="Gift">Gift</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <Input label="Slug" name="slug" value={formData.slug} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Category Image</label>
                {formData.image ? (
                  <div className="relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden group mb-2">
                    <img src={getImageUrl(formData.image)} alt="Category" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors relative mb-2">
                    {uploading ? (
                       <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Upload size={24} className="mb-1" />
                        <span className="text-xs font-medium">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </>
                    )}
                  </label>
                )}
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleChange}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Category</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this category? It will fail if products are still assigned to it.</p>
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

export default CategoryManagement;

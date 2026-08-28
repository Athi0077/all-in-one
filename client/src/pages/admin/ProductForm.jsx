import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createProduct, updateProduct, uploadImage } from '../../services/adminService';
import api from '../../services/api';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { ArrowLeft, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/getImageUrl';
import { getCategories } from '../../services/categoryService';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    shippingCharge: '',
    category: '',
    color: '',
    stock: '',
    sku: '',
    images: [],
    isFeatured: false,
    isActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    const fetchCategoriesList = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        toast.error('Failed to load categories');
      }
    };
    fetchCategoriesList();

    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const { data } = await api.get(`/products/${id}`);
          setFormData({
            name: data.name,
            description: data.description,
            price: data.price,
            discountPrice: data.discountPrice || '',
            shippingCharge: data.shippingCharge || '',
            category: data.category?._id || data.category,
            color: data.color || '',
            stock: data.stock,
            sku: data.sku || '',
            images: data.images || [],
            isFeatured: data.isFeatured,
            isActive: data.isActive,
          });
        } catch (error) {
          toast.error('Failed to load product');
          navigate('/admin/products');
        }
        setLoading(false);
      };
      fetchProduct();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setUploading(true);
    try {
      const imagePath = await uploadImage(form);
      setFormData(prev => ({ ...prev, images: [...prev.images, imagePath] }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Image upload failed');
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
    setImageUrlInput('');
    toast.success('Image URL added');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.price) < 0 || Number(formData.stock) < 0) {
      return toast.error('Price and stock cannot be negative');
    }
    if (Number(formData.discountPrice) > Number(formData.price)) {
      return toast.error('Discount price cannot exceed original price');
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateProduct(id, formData);
        toast.success('Product updated');
      } else {
        await createProduct(formData);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/products" className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isEdit ? 'Edit Product' : 'Create Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Product Name" name="name" value={formData.name} onChange={handleChange} required />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-900 mb-1">Color (Optional)</label>
              <select
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white"
              >
                <option value="">Select a color</option>
                <option value="Red">Red</option>
                <option value="Blue">Blue</option>
                <option value="Green">Green</option>
                <option value="Yellow">Yellow</option>
                <option value="Orange">Orange</option>
                <option value="Purple">Purple</option>
                <option value="Pink">Pink</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Gray">Gray</option>
                <option value="Brown">Brown</option>
                <option value="Cyan">Cyan</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows="4"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Pricing & Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Price (₹)" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />
            <Input label="Discount Price (₹)" name="discountPrice" type="number" min="0" step="0.01" value={formData.discountPrice} onChange={handleChange} />
            <Input label="Shipping Charge (₹)" name="shippingCharge" type="number" min="0" step="0.01" value={formData.shippingCharge} onChange={handleChange} />
            <Input label="Stock Quantity" name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required />
            <Input label="SKU" name="sku" value={formData.sku} onChange={handleChange} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Product Images</h3>
          
          <div className="flex flex-wrap gap-4 mb-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden group">
                <img src={getImageUrl(img)} alt="Product" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"
                >
                  <X size={24} />
                </button>
              </div>
            ))}
            
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors relative">
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
          </div>
          <p className="text-xs text-gray-500 mb-4">Upload high-quality images. The first image will be used as the thumbnail.</p>

          <div className="flex flex-col gap-2 max-w-md">
            <span className="text-sm font-medium text-gray-700">Or add image from URL:</span>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
              <Button 
                type="button"
                onClick={handleAddImageUrl}
                variant="outline"
                className="px-4 py-2"
              >
                Add URL
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Visibility</h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="isActive" 
              checked={formData.isActive} 
              onChange={handleChange}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
            <span className="font-medium text-gray-900">Active (Visible in store)</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="isFeatured" 
              checked={formData.isFeatured} 
              onChange={handleChange}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
            <span className="font-medium text-gray-900">Featured Product</span>
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <Link to="/admin/products">
            <Button type="button" variant="outline" className="rounded-xl px-8">Cancel</Button>
          </Link>
          <Button type="submit" className="rounded-xl px-8" isLoading={submitting}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;

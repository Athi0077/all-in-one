import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProducts, deleteProduct } from '../../services/adminService';
import { Plus, Edit, Trash2, Search, Package, Star } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts(page, 10, keyword);
      setProducts(data.products);
      setPages(data.pages);
    } catch (error) {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, keyword]);

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      toast.error('Error deleting product');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 mt-1">Manage your store's inventory.</p>
        </div>
        <Link to="/admin/products/create">
          <Button className="rounded-xl flex items-center gap-2">
            <Plus size={20} /> Add Product
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-white">
                <th className="py-4 px-6 font-medium whitespace-nowrap">Product</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Category</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Price</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Stock</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Status</th>
                <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-10 bg-gray-200 rounded w-48"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Star size={12} className="text-yellow-400 fill-current mr-1" />
                            {product.rating} ({product.numReviews})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{product.category?.name || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-900">${product.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/edit/${product._id}`}>
                          <button className="p-2 text-gray-400 hover:text-primary bg-white hover:bg-primary/10 rounded-lg transition-colors border border-gray-200 hover:border-primary/20">
                            <Edit size={16} />
                          </button>
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirm(product._id)}
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
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

export default ProductManagement;

import React, { useEffect, useState } from 'react';
import { getReviews, updateReviewStatus, deleteReview } from '../../services/adminService';
import { MessageSquare, Check, X, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (error) {
      toast.error('Failed to load reviews');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReviewStatus(id, status);
      toast.success(`Review ${status.toLowerCase()}`);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReview(id);
      toast.success('Review deleted');
      setDeleteConfirm(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reviews</h1>
        <p className="text-gray-500 mt-1">Manage product reviews and feedback.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                <th className="py-4 px-6 font-medium whitespace-nowrap">Product</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Customer</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Rating</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap min-w-[300px]">Review</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Status</th>
                <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No reviews found</p>
                  </td>
                </tr>
              ) : (
                reviews.map(review => (
                  <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 max-w-[200px] truncate" title={review.product?.name}>
                      {review.product?.name || 'Deleted Product'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{review.name}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate" title={review.comment}>
                      {review.comment}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        review.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        review.status === 'Hidden' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {review.status !== 'Approved' && (
                          <button onClick={() => handleStatusUpdate(review._id, 'Approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                            <Check size={16} />
                          </button>
                        )}
                        {review.status !== 'Hidden' && (
                          <button onClick={() => handleStatusUpdate(review._id, 'Hidden')} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Hide">
                            <X size={16} />
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm(review._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Review</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to permanently delete this review?</p>
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

export default ReviewManagement;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers } from '../../services/adminService';
import { Search, Users as UsersIcon } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(page, 10, keyword);
      setUsers(data.users);
      setPages(data.pages);
    } catch (error) {
      console.error('Failed to load users', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, keyword]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Users</h1>
        <p className="text-gray-500 mt-1">Manage customers and administrators.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
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
                <th className="py-4 px-6 font-medium whitespace-nowrap">Name</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Email</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Role</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Joined</th>
                <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <UsersIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{u.email}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/admin/users/${u._id}`} className="text-primary hover:underline font-medium text-sm">
                        View Details
                      </Link>
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
    </div>
  );
};

export default UserManagement;

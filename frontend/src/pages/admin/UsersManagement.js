import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UsersManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Admin</span>;
    }
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Customer</span>;
  };

  return (
    <div className="p-6" data-testid="users-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Users Management</h1>
        <div className="flex items-center gap-2">
          <Users className="text-[#B76E79]" size={24} />
          <span className="text-lg font-medium">{users.length} Total Users</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Addresses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} data-testid={`user-row-${user.id}`}>
                  <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-sm">{user.addresses?.length || 0} addresses</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;
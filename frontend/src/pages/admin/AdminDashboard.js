import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B76E79] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.total_revenue?.toFixed(2) || 0}`,
      icon: TrendingUp,
      color: 'bg-[#B76E79]',
      textColor: 'text-[#B76E79]',
      bgColor: 'bg-[#B76E79]/10'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`p-6 rounded-lg border-2 border-[#B76E79]/20 ${stat.bgColor} hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Orders Alert */}
      {stats?.pending_orders > 0 && (
        <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Pending Orders</p>
              <p className="text-sm text-yellow-700">
                You have {stats.pending_orders} orders pending processing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="p-6 border-2 border-[#B76E79]/20 bg-white rounded-lg">
        <h3 className="text-xl font-bold text-[#B76E79] mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_orders?.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-[#B76E79]/5 transition-colors">
                  <td className="py-3 px-4 text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-sm font-medium">₹{order.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Products */}
      {stats?.low_stock_products?.length > 0 && (
        <div className="p-6 border-2 border-[#B76E79]/20 bg-white rounded-lg">
          <h3 className="text-xl font-bold text-[#B76E79] mb-4">Low Stock Alert</h3>
          <div className="space-y-3">
            {stats.low_stock_products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600 font-semibold">Only {product.stock} left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

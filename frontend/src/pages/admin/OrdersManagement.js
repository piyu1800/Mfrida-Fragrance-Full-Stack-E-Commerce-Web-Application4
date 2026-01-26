import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, Package } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/orders/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API}/orders/${orderId}/status`,
        { order_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <div className="p-6" data-testid="orders-management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#B76E79]">Orders Management</h1>
        <div className="flex items-center gap-2">
          <Package className="text-[#B76E79]" size={24} />
          <span className="text-lg font-medium">{orders.length} Total Orders</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} data-testid={`order-row-${order.id}`}>
                  <td className="px-6 py-4 text-sm font-medium">#{order.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-sm">{order.user_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{order.items.length} items</td>
                  <td className="px-6 py-4 text-sm font-medium">₹{order.total}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={order.order_status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs ${getStatusColor(order.order_status)}`}
                      data-testid={`order-status-${order.id}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid={`view-order-${order.id}`}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#B76E79]">Order Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between border-b pb-2">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-sm">{selectedOrder.shipping_address?.address || 'N/A'}</p>
                <p className="text-sm">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.pincode}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-[#B76E79]">₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
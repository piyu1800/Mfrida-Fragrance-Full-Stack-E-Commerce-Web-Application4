import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  // const fetchOrders = async () => {
  //   try {
  //     const response = await axios.get(`${API}/orders`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setOrders(response.data);
  //   } catch (error) {
  //     console.error('Error fetching orders:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const fetchOrders = useCallback(async () => {
  try {
    const response = await axios.get(`${API}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOrders(response.data);
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
}, [token]);
  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-700 bg-yellow-100',
      confirmed: 'text-blue-700 bg-blue-100',
      processing: 'text-purple-700 bg-purple-100',
      shipped: 'text-indigo-700 bg-indigo-100',
      delivered: 'text-green-700 bg-green-100',
      cancelled: 'text-red-700 bg-red-100'
    };
    return colors[status] || 'text-gray-700 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="py-24" data-testid="orders-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <h1 className="text-4xl md:text-6xl mb-16">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#585858]">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="border border-[#1A1A1A]/10 p-8" data-testid={`order-${order.id}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm text-[#585858] mb-1">Order ID: {order.id}</p>
                    <p className="text-sm text-[#585858]">
                      Placed on {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 text-sm uppercase tracking-wider ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                    <p className="text-lg font-medium mt-2">₹{order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-20 h-20 bg-[#F5F2EB] flex-shrink-0">
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{item.product_name}</h3>
                        <p className="text-sm text-[#585858]">
                          Qty: {item.quantity} x ₹{item.final_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#1A1A1A]/10">
                  <p className="text-sm text-[#585858] mb-1">Shipping Address:</p>
                  <p className="text-sm">
                    {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                  </p>
                  <p className="text-sm">Phone: {order.shipping_address.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

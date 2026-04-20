import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Package, Truck, Home, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Meesho-style ordered stages (cancelled handled separately)
const STAGES = [
  { key: 'pending',    label: 'Order Placed', icon: Clock },
  { key: 'confirmed',  label: 'Confirmed',    icon: Check },
  { key: 'processing', label: 'Packed',       icon: Package },
  { key: 'shipped',    label: 'Shipped',      icon: Truck },
  { key: 'delivered',  label: 'Delivered',    icon: Home },
];

const OrderDetail = () => {
  const { orderId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (e) {
      console.error('Error loading order:', e);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#585858]">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#585858]">Order not found</p>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === order.order_status);
  const isCancelled = order.order_status === 'cancelled';

  return (
    <div className="py-24" data-testid="order-detail-page">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-sm text-[#585858] hover:text-[#D4AF37] mb-8 transition-colors"
          data-testid="back-to-orders-btn"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl mb-2">Order Details</h1>
            <p className="text-sm text-[#585858]">Order ID: {order.id}</p>
            <p className="text-sm text-[#585858]">
              Placed on {format(new Date(order.created_at), 'MMM dd, yyyy • HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-[#585858]">Total</p>
            <p className="text-3xl font-bold text-[#1A1A1A]">₹{order.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Meesho-style Tracker */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 mb-12 text-center" data-testid="tracker-cancelled">
            <XCircle size={48} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-red-700 mb-1">Order Cancelled</h3>
            <p className="text-sm text-red-600">This order has been cancelled.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1A1A]/10 rounded-xl p-6 md:p-10 mb-12" data-testid="order-tracker">
            {/* Desktop: horizontal stepper */}
            <div className="hidden md:block">
              <div className="relative flex justify-between items-start">
                {/* Progress line (background) */}
                <div className="absolute top-6 left-0 right-0 h-[2px] bg-[#1A1A1A]/10 mx-12" />
                {/* Progress line (filled) */}
                <div
                  className="absolute top-6 left-0 h-[2px] bg-[#D4AF37] mx-12 transition-all duration-500"
                  style={{
                    width: `calc(${currentIndex <= 0 ? 0 : (currentIndex / (STAGES.length - 1)) * 100}% - ${currentIndex <= 0 ? 0 : 96}px)`,
                  }}
                />

                {STAGES.map((stage, idx) => {
                  const Icon = stage.icon;
                  const completed = idx <= currentIndex;
                  const active = idx === currentIndex;
                  return (
                    <div
                      key={stage.key}
                      className="relative z-10 flex flex-col items-center flex-1"
                      data-testid={`stage-${stage.key}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          completed
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A1A1A]'
                            : 'bg-white border-[#1A1A1A]/20 text-[#585858]'
                        } ${active ? 'ring-4 ring-[#D4AF37]/30 scale-110' : ''}`}
                      >
                        <Icon size={20} />
                      </div>
                      <p className={`mt-3 text-sm font-medium text-center ${completed ? 'text-[#1A1A1A]' : 'text-[#585858]'}`}>
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: vertical stepper */}
            <div className="md:hidden space-y-0">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const completed = idx <= currentIndex;
                const active = idx === currentIndex;
                const isLast = idx === STAGES.length - 1;
                return (
                  <div key={stage.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          completed
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#1A1A1A]'
                            : 'bg-white border-[#1A1A1A]/20 text-[#585858]'
                        } ${active ? 'ring-4 ring-[#D4AF37]/30' : ''}`}
                      >
                        <Icon size={16} />
                      </div>
                      {!isLast && (
                        <div className={`w-[2px] flex-1 min-h-[40px] ${idx < currentIndex ? 'bg-[#D4AF37]' : 'bg-[#1A1A1A]/10'}`} />
                      )}
                    </div>
                    <div className="pb-6 pt-2">
                      <p className={`text-sm font-medium ${completed ? 'text-[#1A1A1A]' : 'text-[#585858]'}`}>
                        {stage.label}
                      </p>
                      {active && order.tracking_updates?.length > 0 && (
                        <p className="text-xs text-[#585858] mt-1">
                          {order.tracking_updates[order.tracking_updates.length - 1].message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tracking history log */}
            {order.tracking_updates?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-[#1A1A1A]/10">
                <p className="text-xs uppercase tracking-wider text-[#585858] mb-4">Tracking History</p>
                <div className="space-y-3">
                  {[...order.tracking_updates].reverse().map((t, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-[#D4AF37] mt-1">●</span>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{t.status}</p>
                        <p className="text-[#585858]">{t.message}</p>
                      </div>
                      <span className="text-xs text-[#585858] whitespace-nowrap">
                        {format(new Date(t.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="mb-12">
          <h2 className="text-2xl mb-6">Items ({order.items.length})</h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => {
              // Prefer slug if saved on the order, otherwise fallback to product_id
              const href = `/product/${item.product_slug || item.product_id}`;
              return (
                <Link
                  key={idx}
                  to={href}
                  className="flex gap-4 p-4 border border-[#1A1A1A]/10 rounded-lg hover:border-[#D4AF37] hover:shadow-sm transition-all group"
                  data-testid={`order-item-${idx}`}
                >
                  <div className="w-24 h-24 bg-[#F5F2EB] flex-shrink-0 rounded overflow-hidden">
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-[#D4AF37] transition-colors">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-[#585858] mt-1">Qty: {item.quantity}</p>
                    <p className="text-sm text-[#585858]">₹{item.final_price.toFixed(2)} each</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(item.final_price * item.quantity).toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Shipping + Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#1A1A1A]/10 rounded-lg p-6">
            <h3 className="text-xs uppercase tracking-wider text-[#585858] mb-3">Shipping Address</h3>
            <p className="text-sm">{order.shipping_address.street}</p>
            <p className="text-sm">
              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
            </p>
            <p className="text-sm mt-2">Phone: {order.shipping_address.phone}</p>
          </div>

          <div className="border border-[#1A1A1A]/10 rounded-lg p-6">
            <h3 className="text-xs uppercase tracking-wider text-[#585858] mb-3">Payment</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#585858]">Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#585858]">Discount</span>
              <span>- ₹{order.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-[#1A1A1A]/10 font-semibold">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
            <div className="mt-4 text-xs text-[#585858]">
              <p>Payment Status: <span className="uppercase font-medium text-[#1A1A1A]">{order.payment_status}</span></p>
              {order.payment_method && <p>Method: {order.payment_method}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
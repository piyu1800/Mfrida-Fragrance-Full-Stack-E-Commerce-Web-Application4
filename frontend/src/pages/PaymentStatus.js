import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Safely turn any API error into a plain string (handles FastAPI 422 arrays)
const extractErrorMessage = (error, fallback = 'Failed to verify payment') => {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (typeof e === 'string' ? e : e?.msg || JSON.stringify(e))).join(', ');
  }
  if (typeof detail === 'object') return detail.msg || JSON.stringify(detail);
  return fallback;
};

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Verifying your payment...');

  const verifyPayment = useCallback(async () => {
    const orderId = searchParams.get('order_id');
    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment information');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/orders/verify-phonepe-payment`,
        { order_id: orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setStatus('success');
        setMessage('Payment successful! Your order has been confirmed.');
        clearCart();
        setTimeout(() => navigate('/orders'), 3000);
      } else {
        setStatus('failed');
        setMessage(
          typeof response.data?.message === 'string'
            ? response.data.message
            : 'Payment verification failed'
        );
      }
    } catch (error) {
      setStatus('failed');
      setMessage(extractErrorMessage(error));
    }
  }, [searchParams, token, clearCart, navigate]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F2EB] py-24">
      <div className="max-w-md w-full mx-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center" data-testid="payment-status-card">
          {status === 'checking' && (
            <>
              <div className="mb-6">
                <Loader size={64} className="mx-auto text-[#D4AF37] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Verifying Payment</h2>
              <p className="text-[#585858]">{String(message)}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <CheckCircle size={64} className="mx-auto text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
              <p className="text-[#585858] mb-6">{String(message)}</p>
              <p className="text-sm text-[#585858]">Redirecting to orders...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-6">
                <XCircle size={64} className="mx-auto text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
              <p className="text-[#585858] mb-8" data-testid="payment-error-message">{String(message)}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full bg-[#D4AF37] text-[#1A1A1A] py-4 px-8 rounded-lg font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-[#D4AF37] transition-all duration-300"
                  data-testid="go-to-orders-btn"
                >
                  Go to My Orders
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full bg-[#1A1A1A] text-white py-4 px-8 rounded-lg font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300"
                  data-testid="return-to-cart-btn"
                >
                  Return to Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
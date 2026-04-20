import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const orderId = searchParams.get('order_id');

    if (!orderId ) {
      setStatus('failed');
      setMessage('Invalid payment information');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/orders/verify-phonepe-payment`,
        {
          order_id: orderId,
    
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStatus('success');
        setMessage('Payment successful! Your order has been confirmed.');
        clearCart();
        
        // Redirect to orders page after 3 seconds
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('failed');
      setMessage(error.response?.data?.detail || 'Failed to verify payment');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F2EB] py-24">
      <div className="max-w-md w-full mx-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {status === 'checking' && (
            <>
              <div className="mb-6">
                <Loader size={64} className="mx-auto text-[#D4AF37] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Verifying Payment</h2>
              <p className="text-[#585858]">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <CheckCircle size={64} className="mx-auto text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
              <p className="text-[#585858] mb-6">{message}</p>
              <p className="text-sm text-[#585858]">Redirecting to orders...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-6">
                <XCircle size={64} className="mx-auto text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
              <p className="text-[#585858] mb-8">{message}</p>
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-[#1A1A1A] text-white py-4 px-8 rounded-lg font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300"
              >
                Return to Cart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;

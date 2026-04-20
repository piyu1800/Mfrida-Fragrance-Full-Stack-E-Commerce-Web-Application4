import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = () => {
  const { cartItems, getCartTotal } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create order
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.images[0],
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          final_price: item.final_price
        })),
        shipping_address: address
      };

      const orderResponse = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Create PhonePe payment
      const paymentResponse = await axios.post(
        `${API}/orders/create-phonepe-payment?order_id=${orderResponse.data.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        // Redirect to PhonePe payment page
        window.location.href = paymentResponse.data.redirect_url;
      } else {
        toast.error('Failed to initiate payment');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-24" data-testid="checkout-page">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-6xl mb-16">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-16">
            <h2 className="text-2xl mb-8">Shipping Address</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm uppercase tracking-widest mb-3">Street Address</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                  required
                  data-testid="street-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm uppercase tracking-widest mb-3">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                    required
                    data-testid="city-input"
                  />
                </div>

                <div>
                  <label className="block text-sm uppercase tracking-widest mb-3">State</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                    required
                    data-testid="state-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm uppercase tracking-widest mb-3">Postal Code</label>
                  <input
                    type="text"
                    value={address.postal_code}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                    required
                    data-testid="postal-code-input"
                  />
                </div>

                <div>
                  <label className="block text-sm uppercase tracking-widest mb-3">Phone</label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-4 transition-colors"
                    required
                    data-testid="phone-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F5F2EB] p-8 mb-8">
            <h2 className="text-2xl mb-6">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-[#585858]">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-medium">₹{(item.final_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-[#1A1A1A]/10 pt-4 flex justify-between">
                <span className="text-xl font-medium">Total</span>
                <span className="text-xl font-medium" data-testid="checkout-total">₹{getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1A1A] text-[#FDFBF7] py-5 rounded-none hover:bg-[#B76E79] transition-colors duration-500 disabled:opacity-50"
            data-testid="place-order-button"
          >
            {loading ? 'Processing...' : 'Place Order & Pay'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

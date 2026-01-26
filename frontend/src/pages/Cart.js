import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-24" data-testid="empty-cart">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl mb-4">Your Cart is Empty</h2>
          <p className="text-[#585858] mb-8">Start shopping to add items to your cart</p>
          <Link
            to="/products"
            className="inline-block bg-[#1A1A1A] text-[#FDFBF7] px-10 py-4 rounded-none hover:bg-[#B76E79] transition-colors duration-500"
            data-testid="continue-shopping-link"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24" data-testid="cart-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <h1 className="text-4xl md:text-6xl mb-16">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-6 border-b border-[#1A1A1A]/10 pb-6" data-testid={`cart-item-${item.slug}`}>
                  <div className="w-32 h-32 bg-[#F5F2EB] flex-shrink-0">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-2">{item.name}</h3>
                    <p className="text-sm text-[#585858] mb-4">{item.brand}</p>
                    <p className="text-lg font-medium">₹{item.final_price.toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#991B1B] hover:text-[#7f1d1d] transition-colors"
                      data-testid={`remove-item-${item.slug}`}
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex items-center border border-[#1A1A1A]/20">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-2 hover:bg-[#F5F2EB] transition-colors"
                        data-testid={`decrease-${item.slug}`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-2 border-x border-[#1A1A1A]/20 min-w-[3rem] text-center" data-testid={`quantity-${item.slug}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-2 hover:bg-[#F5F2EB] transition-colors"
                        data-testid={`increase-${item.slug}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#F5F2EB] p-8 sticky top-24">
              <h2 className="text-2xl mb-8">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-[#585858]">Subtotal</span>
                  <span className="font-medium">₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#585858]">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t border-[#1A1A1A]/10 pt-4 flex justify-between">
                  <span className="text-xl font-medium">Total</span>
                  <span className="text-xl font-medium" data-testid="cart-total">₹{getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[#1A1A1A] text-[#FDFBF7] py-4 rounded-none hover:bg-[#B76E79] transition-colors duration-500"
                data-testid="proceed-to-checkout-button"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center mt-4 text-[#585858] hover:text-[#1A1A1A] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

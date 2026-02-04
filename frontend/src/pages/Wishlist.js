import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-24">
        <div className="text-center">
          <Heart size={64} className="mx-auto mb-4 text-[#B76E79]" />
          <h2 className="text-3xl mb-4">Your Wishlist is Empty</h2>
          <p className="text-[#585858] mb-8">Please login to view your wishlist</p>
          <Link
            to="/auth"
            className="inline-block bg-[#1A1A1A] text-[#FDFBF7] py-3 px-8 hover:bg-[#B76E79] transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#585858]">Loading wishlist...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-24">
        <div className="text-center">
          <Heart size={64} className="mx-auto mb-4 text-[#B76E79]" />
          <h2 className="text-3xl mb-4">Your Wishlist is Empty</h2>
          <p className="text-[#585858] mb-8">Save items you love for later</p>
          <Link
            to="/products"
            className="inline-block bg-[#1A1A1A] text-[#FDFBF7] py-3 px-8 hover:bg-[#B76E79] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24" data-testid="wishlist-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl mb-4">My Wishlist</h1>
          <p className="text-[#585858]">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
              data-testid={`wishlist-item-${product.id}`}
            >
              <div className="relative">
                <Link to={`/product/${product.slug}`}>
                  <div className="aspect-[3/4] bg-[#F5F2EB] mb-4 overflow-hidden">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  data-testid={`remove-wishlist-${product.id}`}
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>

              <div className="space-y-2">
                <Link to={`/product/${product.slug}`}>
                  <p className="text-xs uppercase tracking-widest text-[#B76E79]">{product.brand}</p>
                  <h3 className="font-medium hover:text-[#B76E79] transition-colors">{product.name}</h3>
                </Link>

                <div className="flex items-center gap-2">
                  {product.discount > 0 ? (
                    <>
                      <p className="font-medium">₹{product.final_price.toFixed(2)}</p>
                      <p className="text-sm text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="font-medium">₹{product.price.toFixed(2)}</p>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full bg-[#1A1A1A] text-[#FDFBF7] py-3 px-4 hover:bg-[#B76E79] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid={`add-to-cart-${product.id}`}
                >
                  <ShoppingCart size={16} />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
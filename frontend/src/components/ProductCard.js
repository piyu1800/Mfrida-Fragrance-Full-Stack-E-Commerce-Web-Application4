import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner';

const ProductCard = ({ product, showBuyNow = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart!', {
      description: `${product.name} has been added to your cart.`
    });
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    navigate('/checkout');
    toast.success('Proceeding to checkout!');
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="premium-card group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`product-card-${product.slug}`}
    >
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image Container with Gradient Overlay */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-[#F5F2EB] to-[#E8DCC8] mb-4 shadow-lg">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
          
          {/* Gradient Overlay on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
          
          {/* Discount Badge */}
          {product.discount > 0 && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-[#D4AF37] to-[#F4E4BC] text-[#1A1A1A] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
              {product.discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
              inWishlist 
                ? 'bg-[#D4AF37] text-white' 
                : 'bg-white/90 text-[#1A1A1A] hover:bg-[#D4AF37] hover:text-white'
            }`}
          >
            <Heart size={18} className={inWishlist ? 'fill-current' : ''} />
          </button>

          {/* Quick Actions - Shows on Hover */}
          <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 space-y-2 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full btn-golden text-[#1A1A1A] font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} />
              <span className="uppercase tracking-wider text-sm">Add to Cart</span>
            </button>
            
            {showBuyNow && product.stock > 0 && (
              <button
                onClick={handleBuyNow}
                className="w-full bg-[#1A1A1A] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-xl hover:bg-[#2A2A2A] transition-colors"
              >
                <span className="uppercase tracking-wider text-sm">Buy Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Info with Premium Styling */}
        <div className="space-y-2 px-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">{product.brand}</p>
          <h3 className="text-base font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.total_reviews > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[#1A1A1A]">{product.average_rating}</span>
              <span className="text-xs text-[#585858]">({product.total_reviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 pt-1">
            {product.discount > 0 ? (
              <>
                <p className="text-xl font-bold text-[#D4AF37]">₹{product.final_price.toFixed(2)}</p>
                <p className="text-sm text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-xl font-bold text-[#D4AF37]">₹{product.price.toFixed(2)}</p>
            )}
          </div>

          {/* Stock Status */}
          {product.stock === 0 && (
            <p className="text-sm text-red-600 font-semibold">Out of Stock</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;

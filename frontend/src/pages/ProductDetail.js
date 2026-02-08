import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight, Check, Truck, RotateCcw, Shield, User, CreditCard, XCircle, Lock, Package } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('reviews');
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    // Reset states when slug changes
    setProduct(null);
    setVariants([]);
    setSelectedImage(0);
    setQuantity(1);
    
    fetchProductData();
  }, [slug]);

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      await addToWishlist(product.id);
      toast.success('Added to wishlist!');
    }
  };

  const fetchProductData = async () => {
    try {
      const [productRes, reviewsRes, allProductsRes] = await Promise.all([
        axios.get(`${API}/products/slug/${slug}`),
        axios.get(`${API}/reviews?product_id=&is_approved=true`),
        axios.get(`${API}/products?limit=20`)
      ]);

      setProduct(productRes.data);
      
      // NEW: Set variants from API response
      if (productRes.data.variants && productRes.data.variants.length > 0) {
        setVariants(productRes.data.variants);
      } else {
        setVariants([]);
      }
      
      const productReviews = reviewsRes.data.filter(r => r.product_id === productRes.data.id);
      setReviews(productReviews);

      if (productRes.data.category_id) {
        const relatedRes = await axios.get(`${API}/products?category_id=${productRes.data.category_id}&limit=8`);
        const related = relatedRes.data.filter(p => p.id !== productRes.data.id);
        setRelatedProducts(related);
        setFrequentlyBought(related.slice(0, 4));
      } else {
        const otherProducts = allProductsRes.data.filter(p => p.id !== productRes.data.id);
        setFrequentlyBought(otherProducts.slice(0, 4));
        setRelatedProducts(otherProducts.slice(4, 12));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    toast.success('Added to cart!', {
      description: `${product.name} (${quantity}x) added to your cart.`
    });
  };

  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    navigate('/checkout');
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const getRatingBreakdown = () => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      breakdown[review.rating]++;
    });
    return breakdown;
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    );
  }

  const ratingBreakdown = getRatingBreakdown();
  const totalReviews = reviews.length;

  return (
    <div className="py-12 md:py-20 bg-gradient-to-b from-white to-[#FFFBF5]" data-testid="product-detail-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        {/* PRODUCT MAIN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20">
          {/* LEFT: IMAGE GALLERY */}
          <div>
            {/* Main Image with Enhanced Animation */}
            <motion.div 
              className="relative bg-gradient-to-br from-[#F5F2EB] via-[#FFFBF5] to-[#E8DCC8] overflow-hidden rounded-2xl shadow-2xl mb-6"
              style={{ height: '600px' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                  initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  data-testid="product-main-image"
                />
              </AnimatePresence>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Image Counter Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 left-6 bg-[#1A1A1A]/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
              >
                {selectedImage + 1} / {product.images.length}
              </motion.div>
              
              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <motion.button
                    onClick={prevImage}
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#D4AF37] hover:text-white p-3 rounded-full transition-all shadow-xl backdrop-blur-sm border-2 border-[#D4AF37]/20"
                    data-testid="prev-image-button"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  <motion.button
                    onClick={nextImage}
                    whileHover={{ scale: 1.1, x: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#D4AF37] hover:text-white p-3 rounded-full transition-all shadow-xl backdrop-blur-sm border-2 border-[#D4AF37]/20"
                    data-testid="next-image-button"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Thumbnails - Grid Layout with Animations */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-square bg-gradient-to-br from-[#F5F2EB] to-[#E8DCC8] overflow-hidden rounded-xl border-2 transition-all duration-300 shadow-md group ${
                      selectedImage === index 
                        ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/30 shadow-xl' 
                        : 'border-transparent hover:border-[#D4AF37]/50 hover:shadow-lg'
                    }`}
                    data-testid={`product-thumbnail-${index}`}
                  >
                    <img 
                      src={image} 
                      alt="" 
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        selectedImage === index ? 'scale-100' : 'scale-90 group-hover:scale-100'
                      }`}
                    />
                    
                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#D4AF37]/20 to-transparent transition-opacity duration-300 ${
                      selectedImage === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}></div>
                    
                    {/* Selected Indicator */}
                    {selectedImage === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-[#D4AF37] text-white rounded-full p-1 shadow-lg"
                      >
                        <Check size={14} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
                        {/* Variant Selector - NEW DESIGN */}
            {variants.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Select Size
                  </h3>
                  <span className="text-xs text-[#585858]">
                    {variants.length + 1} options available
                  </span>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {/* Current Product - Always First */}
                  <div className="relative bg-gradient-to-br from-[#D4AF37] to-[#B8931F] rounded-xl p-4 border-3 border-[#D4AF37] shadow-lg text-center cursor-default group">
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Check size={12} />
                      </div>
                    </div>
                    
                    <div className="text-white">
                      <p className="text-2xl font-bold mb-1">
                        {product.variant_name || 'Default'}
                      </p>
                      <p className="text-xs opacity-90 mb-2">Current</p>
                      <p className="text-sm font-bold">
                        ₹{product.final_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Other Variants */}
                  {variants.map((variant) => (
                    <Link
                      key={variant.id}
                      to={`/product/${variant.slug}`}
                      className="relative bg-white hover:bg-[#F5F2EB] rounded-xl p-4 border-2 border-gray-200 hover:border-[#D4AF37] shadow-md hover:shadow-xl transition-all duration-300 text-center group"
                    >
                      {variant.discount > 0 && (
                        <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {variant.discount}%
                        </div>
                      )}
                      
                      <div className="text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors">
                        <p className="text-2xl font-bold mb-1">
                          {variant.variant_name || 'Variant'}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">Available</p>
                        <p className="text-sm font-bold">
                          ₹{variant.final_price.toFixed(2)}
                        </p>
                        
                        {variant.stock > 0 ? (
                          <p className="text-xs text-green-600 mt-1 font-semibold">
                            In Stock
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 mt-1 font-semibold">
                            Out of Stock
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-[#585858] flex items-center justify-center gap-2">
                    <Shield size={14} className="text-[#D4AF37]" />
                    All sizes contain the same premium fragrance
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-2 font-semibold">{product.brand}</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl mb-2 font-bold text-[#1A1A1A]">{product.name}</h1>
            
            {/* Variant Name Display */}
            {product.variant_name && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#F5F2EB] px-4 py-2 rounded-full border-2 border-[#D4AF37]/30"
              >
                <span className="text-sm font-bold text-[#1A1A1A]">Size:</span>
                <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">
                  {product.variant_name}
                </span>
              </motion.div>
            )}

            {/* Rating Summary */}
            {product.total_reviews > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{product.average_rating}</span>
                <span className="text-sm text-[#585858]">({product.total_reviews} reviews)</span>
              </div>
            )}

            {/* Price Section with Variant Info */}
            <div className="mb-8 p-6 bg-gradient-to-r from-[#F5F2EB] to-white rounded-xl border-2 border-[#D4AF37]/20">
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-sm uppercase tracking-wider text-[#585858] font-semibold">Price</p>
                {product.variant_name && (
                  <span className="text-xs text-[#D4AF37] font-semibold">
                    ({product.variant_name})
                  </span>
                )}
              </div>
              
              {product.discount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-bold text-[#D4AF37]">₹{product.final_price.toFixed(2)}</p>
                    <p className="text-xl text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
                    <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {product.discount}% OFF
                    </span>
                  </div>
                  <p className="text-sm text-green-600 font-semibold">You save ₹{(product.price - product.final_price).toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-4xl font-bold text-[#D4AF37]">₹{product.price.toFixed(2)}</p>
              )}
              <p className="text-xs text-[#585858] mt-2">Inclusive of all taxes*</p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-[#585858] leading-relaxed text-base">{product.description}</p>
            </div>

            {/* Fragrance Notes */}
            {product.fragrance_notes && (
              <div className="mb-8 p-6 bg-gradient-to-br from-[#F5F2EB] to-white rounded-xl border border-[#D4AF37]/20">
                <h3 className="text-sm uppercase tracking-[0.2em] mb-3 text-[#D4AF37] font-semibold">Fragrance Notes</h3>
                <p className="text-[#585858]">{product.fragrance_notes}</p>
              </div>
            )}

            {/* Product Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 p-6 bg-gradient-to-br from-white to-[#F5F2EB] rounded-xl border-2 border-[#D4AF37]/20 shadow-md"
              >
                <h3 className="text-sm uppercase tracking-[0.2em] mb-4 text-[#D4AF37] font-bold flex items-center gap-2">
                  <Package size={18} />
                  Product Specifications
                </h3>
                <div className="space-y-3">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start justify-between py-2 border-b border-[#D4AF37]/10 last:border-0"
                    >
                      <span className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                        {key}
                      </span>
                      <span className="text-sm text-[#585858] text-right ml-4">
                        {value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}



            {/* Stock Status */}
            <div className="mb-6 flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <Check size={18} className="text-green-600" />
                  <p className="text-sm font-semibold text-green-600">
                    In Stock ({product.stock} available)
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-red-600">Out of Stock</p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="text-sm uppercase tracking-wider text-[#585858] mb-3 block font-semibold">Quantity</label>
              <div className="flex items-center border-2 border-[#D4AF37]/30 rounded-lg overflow-hidden w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 py-3 hover:bg-[#D4AF37] hover:text-white transition-colors font-bold text-lg"
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="px-8 py-3 border-x-2 border-[#D4AF37]/30 font-bold text-lg" data-testid="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-6 py-3 hover:bg-[#D4AF37] hover:text-white transition-colors font-bold text-lg"
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn-golden text-[#1A1A1A] py-4 px-8 rounded-lg font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-300"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 bg-[#1A1A1A] text-white py-4 px-8 rounded-lg font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                data-testid="buy-now-button"
              >
                Buy Now
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`border-2 py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:scale-110 ${
                  isInWishlist(product.id)
                    ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                    : 'border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white'
                }`}
                data-testid="add-to-wishlist-button"
              >
                <Heart 
                  size={24} 
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {/* Benefits Icons - Enhanced with 6 Items */}
            
          </div>
          
        </div>
        <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gradient-to-r from-[#F5F2EB] to-white rounded-xl border border-[#D4AF37]/20 shadow-md"
            >
              <div className="text-center p-3 rounded-lg hover:bg-white/50 transition-all duration-300">
                <Shield size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">100% Original</p>
              </div>
              
              <div className="text-center p-3 rounded-lg hover:bg-white/50 transition-all duration-300">
                <Truck size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Free Delivery</p>
              </div>
              
              <div className="text-center p-3 rounded-lg hover:bg-white/50 transition-all duration-300">
                <Lock size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Secure Transaction</p>
              </div>
              
              <div className="text-center p-3 rounded-lg hover:bg-white/50 transition-all duration-300">
                <CreditCard size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Online Payment</p>
              </div>
              
              <div className="text-center p-3 rounded-lg hover:bg-white/50 transition-all duration-300">
                <XCircle size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Non-Returnable</p>
              </div>
            
            </motion.div>

        {/* INCREASED SPACING - mb-28 for extra space */}
        <div className="mb-28"></div>

        {/* LOGIN PROMPT FOR NON-USERS */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-28 bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] text-white p-12 rounded-2xl text-center relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent"></div>
            <div className="relative z-10">
              <User size={48} className="mx-auto mb-4 text-[#D4AF37]" />
              <h3 className="text-3xl font-bold mb-4">Login to Unlock Benefits</h3>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">Join us to get exclusive offers, faster checkout, and track your orders!</p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/auth"
                  className="btn-golden text-[#1A1A1A] py-3 px-8 rounded-lg font-bold uppercase tracking-wider shadow-xl inline-block"
                >
                  Login Now
                </Link>
                <Link
                  to="/auth"
                  className="bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] py-3 px-8 rounded-lg font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all duration-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* REVIEWS SECTION */}
        <div className="mb-28" data-testid="reviews-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent mb-2">Customer Reviews</h2>
            <p className="text-[#585858]">See what our customers are saying</p>
          </motion.div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: Rating Summary */}
              <div className="lg:col-span-1 bg-gradient-to-br from-[#F5F2EB] to-white p-8 rounded-2xl border-2 border-[#D4AF37]/20 shadow-lg">
                <div className="text-center mb-6">
                  <p className="text-6xl font-bold text-[#D4AF37] mb-2">{product.average_rating}</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#585858]">Based on {totalReviews} reviews</p>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingBreakdown[rating];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm font-semibold w-8">{rating} ★</span>
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: (5 - rating) * 0.1 }}
                            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4E4BC]"
                          />
                        </div>
                        <span className="text-sm text-[#585858] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Reviews List */}
              <div className="lg:col-span-2 space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl border-2 border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#1A1A1A] text-lg">{review.user_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-[#585858]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#585858] leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-[#F5F2EB] rounded-xl">
              <p className="text-[#585858]">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER */}
        {frequentlyBought.length > 0 && (
          <div className="mb-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent mb-2">Frequently Bought Together</h2>
              <p className="text-[#585858]">Customers who bought this also bought</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {frequentlyBought.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/product/${item.slug}`} className="block group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-[#F5F2EB] to-[#E8DCC8] mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-[#D4AF37] text-[#1A1A1A] text-xs font-bold px-3 py-1 rounded-full">
                          {item.discount}% OFF
                        </div>
                      )}
                    </div>
                    <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">{item.brand}</p>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-[#D4AF37]">₹{item.final_price.toFixed(2)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDED FOR YOU */}
        {relatedProducts.length > 0 && (
          <div data-testid="related-products-section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent mb-2">Recommended For You</h2>
              <p className="text-[#585858]">You may also like these products</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 8).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/product/${item.slug}`} className="block group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-[#F5F2EB] to-[#E8DCC8] mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-[#D4AF37] text-[#1A1A1A] text-xs font-bold px-3 py-1 rounded-full">
                          {item.discount}% OFF
                        </div>
                      )}
                    </div>
                    <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold mb-1">{item.brand}</p>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-[#D4AF37]">₹{item.final_price.toFixed(2)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B8931F;
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;

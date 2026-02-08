import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight, Check, Truck, RotateCcw, Shield, User } from 'lucide-react';
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

  useEffect(() => {
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
        

                        <div className="relative bg-[#F5F2EB] overflow-hidden" style={{ height: '500px' }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  data-testid="product-main-image"
                />
              </AnimatePresence>
              
              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all"
                    data-testid="prev-image-button"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all"
                    data-testid="next-image-button"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails - Horizontal */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 bg-[#F5F2EB] overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-[#B76E79] scale-105' : 'border-transparent hover:border-[#B76E79]/50'
                    }`}
                    data-testid={`product-thumbnail-${index}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
          
            )}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-2 font-semibold">{product.brand}</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl mb-4 font-bold text-[#1A1A1A]">{product.name}</h1>

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

            {/* Price Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-[#F5F2EB] to-white rounded-xl border-2 border-[#D4AF37]/20">
              {product.discount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-bold text-[#D4AF37]">₹{product.final_price.toFixed(2)}</p>
                    <p className="text-xl text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
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

            {/* Benefits Icons */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-[#F5F2EB] to-white rounded-xl border border-[#D4AF37]/20">
              <div className="text-center">
                <Shield size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider">100% Original</p>
              </div>
              <div className="text-center">
                <RotateCcw size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider">7 Day Return</p>
              </div>
              <div className="text-center">
                <Truck size={32} className="mx-auto mb-2 text-[#D4AF37]" />
                <p className="text-xs font-semibold uppercase tracking-wider">Free Shipping</p>
              </div>
            </div>
          </div>
        </div>

        {/* LOGIN PROMPT FOR NON-USERS */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] text-white p-12 rounded-2xl text-center relative overflow-hidden"
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
        <div className="mb-20" data-testid="reviews-section">
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
          <div className="mb-20">
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
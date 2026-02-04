import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();

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
    } else {
      await addToWishlist(product.id);
    }
  };
  const fetchProductData = async () => {
    try {
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`${API}/products/slug/${slug}`),
        axios.get(`${API}/reviews?product_id=&is_approved=true`)
      ]);

      setProduct(productRes.data);
      setReviews(reviewsRes.data.filter(r => r.product_id === productRes.data.id));

      if (productRes.data.category_id) {
        const relatedRes = await axios.get(`${API}/products?category_id=${productRes.data.category_id}&limit=4`);
        setRelatedProducts(relatedRes.data.filter(p => p.id !== productRes.data.id));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success('Added to cart!');
  };

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="py-24" data-testid="product-detail-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-[3/4] bg-[#F5F2EB] mb-6 overflow-hidden"
            >
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="product-main-image"
              />
            </motion.div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-[#F5F2EB] overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-[#B76E79]' : 'border-transparent'
                    }`}
                    data-testid={`product-thumbnail-${index}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-[#B76E79] mb-2">{product.brand}</p>
            <h1 className="text-4xl md:text-5xl mb-6">{product.name}</h1>
            
            {product.total_reviews > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#585858]">({product.total_reviews} reviews)</span>
              </div>
            )}

            <div className="mb-8">
              {product.discount > 0 ? (
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-medium">₹{product.final_price.toFixed(2)}</p>
                  <p className="text-xl text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
                  <span className="bg-[#B76E79] text-white text-sm px-3 py-1 uppercase tracking-wider">
                    {product.discount}% Off
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-medium">₹{product.price.toFixed(2)}</p>
              )}
            </div>

            <div className="mb-8">
              <p className="text-[#585858] leading-relaxed">{product.description}</p>
            </div>

            {product.fragrance_notes && (
              <div className="mb-8 p-6 bg-[#F5F2EB]">
                <h3 className="text-sm uppercase tracking-widest mb-3">Fragrance Notes</h3>
                <p className="text-[#585858]">{product.fragrance_notes}</p>
              </div>
            )}

            <div className="mb-8">
              <p className={`text-sm ${product.stock > 0 ? 'text-[#2E5C55]' : 'text-[#991B1B]'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </p>
            </div>

            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-[#1A1A1A]/20">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-6 py-4 hover:bg-[#F5F2EB] transition-colors"
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="px-6 py-4 border-x border-[#1A1A1A]/20" data-testid="quantity-display">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-6 py-4 hover:bg-[#F5F2EB] transition-colors"
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-[#1A1A1A] text-[#FDFBF7] py-4 px-8 rounded-none hover:bg-[#B76E79] transition-colors duration-500 disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="add-to-cart-button"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`border py-4 px-6 rounded-none transition-colors duration-300 ${
                  isInWishlist(product.id)
                    ? 'bg-[#B76E79] text-white border-[#B76E79] hover:bg-[#a05e68]'
                    : 'border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFBF7]'
                }`}
                data-testid="add-to-wishlist-button"
              >
                <Heart 
                  size={20} 
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mb-32" data-testid="reviews-section">
            <h2 className="text-3xl md:text-4xl mb-12">Customer Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-[#1A1A1A]/10 pb-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1">
                      <p className="font-medium mb-1">{review.user_name}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[#585858]">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div data-testid="related-products-section">
            <h2 className="text-3xl md:text-4xl mb-12">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} to={`/product/${relatedProduct.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F2EB] mb-6">
                      <img
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-lg font-normal">{relatedProduct.name}</h3>
                    <p className="text-lg font-medium mt-2">₹{relatedProduct.final_price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

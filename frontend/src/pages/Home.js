import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ShoppingCart, Heart } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'sonner';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [homepage, setHomepage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  // Auto-rotation for banners with infinite loop
  useEffect(() => {
    if (banners && banners.length > 1) {
      const interval = setInterval(() => {
        handleNext();
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners, currentBannerIndex]);

  // Handle transition end for infinite loop
  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // const handleNext = () => {
  //   if (currentBannerIndex === banners.length) {
  //     setIsTransitioning(false);
  //     setCurrentBannerIndex(0);
  //     setTimeout(() => {
  //       setIsTransitioning(true);
  //       setCurrentBannerIndex(1);
  //     }, 50);
  //   } else {
  //     setCurrentBannerIndex(prev => prev + 1);
  //   }
  // };
const handleNext = useCallback(() => {
  if (currentBannerIndex === banners.length) {
    setIsTransitioning(false);
    setCurrentBannerIndex(0);
    setTimeout(() => {
      setIsTransitioning(true);
      setCurrentBannerIndex(1);
    }, 50);
  } else {
    setCurrentBannerIndex(prev => prev + 1);
  }
}, [currentBannerIndex, banners.length]);
  const handlePrev = () => {
    if (currentBannerIndex === 0) {
      setIsTransitioning(false);
      setCurrentBannerIndex(banners.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentBannerIndex(banners.length - 1);
      }, 50);
    } else {
      setCurrentBannerIndex(prev => prev - 1);
    }
  };

  const handleDotClick = (index) => {
    setIsTransitioning(true);
    setCurrentBannerIndex(index);
  };

  const fetchHomepageData = async () => {
    try {
      const [homepageRes, categoriesRes, bannersRes, featuredRes, bestSellingRes, newArrivalsRes] = await Promise.all([
        axios.get(`${API}/admin/homepage`),
        axios.get(`${API}/categories?is_active=true`),
        axios.get(`${API}/banners?is_active=true`),
        axios.get(`${API}/products?is_featured=true&limit=8`),
        axios.get(`${API}/products?is_best_selling=true&limit=8`),
        axios.get(`${API}/products?is_new_arrival=true&limit=8`)
      ]);

      setHomepage(homepageRes.data);
      setCategories(categoriesRes.data);
      setBanners(bannersRes.data);
      setFeaturedProducts(featuredRes.data);
      setBestSelling(bestSellingRes.data);
      setNewArrivals(newArrivalsRes.data);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    }
  };
 const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const inWishlist = isInWishlist(product.id);

    const handleAddToCart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      addToCart(product.id, 1);
      toast.success('Added to cart!', {
        description: `${product.name} has been added to your cart.`
      });
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

            {/* Quick Add to Cart Button - Shows on Hover */}
            <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <button
                onClick={handleAddToCart}
                className="w-full btn-golden text-[#1A1A1A] font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-xl"
              >
                <ShoppingCart size={18} />
                <span className="uppercase tracking-wider text-sm">Add to Cart</span>
              </button>
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
          </div>
        </Link>
      </motion.div>
    );
  };
  // Create extended banners array for infinite loop
  const extendedBanners = banners.length > 0 ? [banners[banners.length - 1], ...banners, banners[0]] : [];

  return (
    <div data-testid="home-page">
      {/* Hero Banner Slider with Infinite Loop */}
            {banners && banners.length > 0 && (
        <section className="relative h-[500px] md:h-[600px] lg:h-[650px] flex items-center overflow-hidden" data-testid="hero-section">
          {/* Sliding banners */}
          {/* Sliding banners */}
          <div 
            ref={sliderRef}
            className="absolute inset-0 flex"
            style={{ 
              transform: `translateX(-${(currentBannerIndex + 1) * 100}%)`,
              transition: isTransitioning ? 'transform 1000ms ease-in-out' : 'none'
            }}
          >
            {extendedBanners.map((banner, index) => (
              <div
                key={`banner-${index}`}
                className="min-w-full h-full relative flex-shrink-0"
                style={{
                  backgroundImage: `url(${banner.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F]/70 via-[#0F0F0F]/40 to-transparent"></div>
                
                <div className="relative z-10 h-full flex items-center max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                  >
                    <h1 className="banner-title text-white text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight animate-fadeInUp">
                      {banner.title}
                    </h1>
                    {banner.subtitle && (
                      <p className="banner-subtitle text-white/95 text-lg md:text-xl mb-10 max-w-xl animate-fadeInUp" style={{animationDelay: '0.2s'}}>
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.cta_text && banner.cta_link && (
                       <Link
                        to={banner.cta_link}
                        className="inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-8 py-4 rounded hover:bg-[#B76E79] hover:text-white transition-all duration-300 group shadow-lg"
                        data-testid="hero-cta-button"
                      >
                        <span className="uppercase tracking-wider text-sm font-semibold">
                          {banner.cta_text}
                        </span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
              {banners.map((banner, index) => (
                <button
                  key={banner.id || index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentBannerIndex === index 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  data-testid={`banner-dot-${index}`}
                />
              ))}
            </div>
          )}

          {/* Previous/Next buttons */}
          {banners.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                data-testid="banner-prev-button"
              >
                <ArrowRight size={24} className="rotate-180" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-sm transition-all"
                data-testid="banner-next-button"
              >
                <ArrowRight size={24} />
              </button>
            </>
          )}
        </section>
      )}

      {/* Categories Section */}
       <section className="py-16 md:py-20 bg-gradient-to-b from-white via-[#FFFBF5] to-white" data-testid="categories-section">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-semibold animate-float">Explore Our Collections</p>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent">Shop by Category</h2>
          </motion.div>

          {/* CENTERED GRID - Categories start from center */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-7xl">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  data-testid={`category-${category.slug}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 40, rotateY: -15 }}
                    whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      y: -15,
                      scale: 1.05,
                      transition: { duration: 0.3 }
                    }}
                    className="group cursor-pointer"
                  >
                    {/* Category Card with Premium Design */}
                    <div className="relative">
                      {/* Image Container with Golden Border */}
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-[#F5F2EB] to-[#E8DCC8] shadow-lg group-hover:shadow-2xl transition-all duration-500 border-2 border-transparent group-hover:border-[#D4AF37]">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-3"
                        />
                        
                        {/* Golden Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>

                      {/* Category Name with Premium Styling */}
                      <div className="mt-4 text-center">
                        <h3 className="text-base md:text-lg font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors duration-300 uppercase tracking-wide">
                          {category.name}
                        </h3>
                        
                        {/* Animated Underline */}
                        <div className="h-0.5 w-0 group-hover:w-full mx-auto mt-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-all duration-500"></div>
                      </div>

                      {/* Decorative Corner Elements */}
                      <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-lg"></div>
                      <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-br-lg"></div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
       <section className="py-16 md:py-20 bg-gradient-to-b from-white to-[#F5F2EB]" data-testid="featured-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-semibold animate-float">Curated for You</p>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent mb-4">Featured Collection</h2>
              <p className="text-[#585858] max-w-2xl mx-auto text-lg">Discover our handpicked selection of exquisite fragrances</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 border border-[#1A1A1A] px-10 py-4 rounded-none hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
                data-testid="view-all-button"
              >
                <span className="uppercase tracking-widest text-sm">View All Products</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Best Selling Section */}
      {bestSelling.length > 0 && (
          <section className="py-16 md:py-20 bg-white" data-testid="bestsellers-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-semibold animate-float">Customer Favorites</p>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1A1A1A] via-[#D4AF37] to-[#1A1A1A] bg-clip-text text-transparent">Best Selling Fragrances</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {bestSelling.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

       {newArrivals.length > 0 && (
        <section className="py-16 md:py-20 bg-gradient-to-b from-white via-[#1A1A1A] to-[#1A1A1A] relative overflow-hidden" data-testid="new-arrivals-section">
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37] mb-3 font-semibold animate-float">Just Arrived</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">New Arrivals</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">Discover our latest collection of exquisite fragrances</p>
            </motion.div>

            {/* SWIPER CAROUSEL - TITAN STYLE */}
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                slidesPerView="auto"
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2.5,
                  slideShadows: false,
                }}
                autoplay={{
                  delay: 3500,
                  disableOnInteraction: false,
                }}
                navigation={{
                  nextEl: '.swiper-button-next-custom',
                  prevEl: '.swiper-button-prev-custom',
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                breakpoints={{
                  320: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                  },
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 40,
                  },
                  1280: {
                    slidesPerView: 4,
                    spaceBetween: 50,
                  },
                }}
                className="new-arrivals-swiper py-12"
              >
                {newArrivals.map((product) => (
                  <SwiperSlide key={product.id} className="!h-auto">
                    <Link 
                      to={`/product/${product.slug}`}
                      className="block group"
                      data-testid={`new-arrival-${product.slug}`}
                    >
                      <motion.div
                        whileHover={{ y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="relative h-[450px] md:h-[550px] rounded-2xl overflow-hidden shadow-2xl"
                      >
                        {/* Product Image */}
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                        {/* Discount Badge */}
                        {product.discount > 0 && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#F4E4BC] text-[#1A1A1A] text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg z-10">
                            {product.discount}% OFF
                          </div>
                        )}

                        {/* Product Info - Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-2">
                            {product.brand}
                          </p>
                          <h3 className="text-xl md:text-2xl font-bold mb-3 line-clamp-2">
                            {product.name}
                          </h3>

                          {/* Rating */}
                          {product.total_reviews > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={14} 
                                    className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-400'}
                                  />
                                ))}
                              </div>
                              <span className="text-sm">{product.average_rating}</span>
                              <span className="text-xs text-white/70">({product.total_reviews})</span>
                            </div>
                          )}

                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product.id, 1);
                              toast.success('Added to cart!', {
                                description: `${product.name} has been added to your cart.`
                              });
                            }}
                            className="w-full btn-golden text-[#1A1A1A] font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <ShoppingCart size={18} />
                            <span className="uppercase tracking-wider text-sm">Add to Cart</span>
                          </button>
                        </div>

                        {/* Shine Effect on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                      </motion.div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Custom Navigation Buttons */}
              <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#D4AF37] hover:bg-[#F4E4BC] text-[#1A1A1A] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110">
                <ArrowRight size={24} className="rotate-180" />
              </button>
              <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#D4AF37] hover:bg-[#F4E4BC] text-[#1A1A1A] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110">
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
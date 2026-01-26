import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [homepage, setHomepage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    fetchHomepageData();
  }, []);

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

  const ProductCard = ({ product }) => (
    <Link to={`/product/${product.slug}`} data-testid={`product-card-${product.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group cursor-pointer"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F2EB] mb-6">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.discount > 0 && (
            <div className="absolute top-4 right-4 bg-[#B76E79] text-white text-xs px-3 py-1 uppercase tracking-wider">
              {product.discount}% Off
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#585858]">{product.brand}</p>
          <h3 className="text-lg font-normal">{product.name}</h3>
          <div className="flex items-center gap-2">
            {product.discount > 0 ? (
              <>
                <p className="text-lg font-medium">₹{product.final_price.toFixed(2)}</p>
                <p className="text-sm text-[#585858] line-through">₹{product.price.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-lg font-medium">₹{product.price.toFixed(2)}</p>
            )}
          </div>
          {product.total_reviews > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
              <span className="text-sm">{product.average_rating}</span>
              <span className="text-xs text-[#585858]">({product.total_reviews})</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );

  return (
    <div data-testid="home-page">
      {homepage && homepage.hero_banners.length > 0 && (
        <section className="relative h-[70vh] md:h-[85vh] flex items-center" data-testid="hero-section">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${homepage.hero_banners[0].image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F]/60 to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <h1 className="text-white text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
                {homepage.hero_banners[0].title}
              </h1>
              <p className="text-white/90 text-lg md:text-xl mb-12 font-light">
                {homepage.hero_banners[0].subtitle}
              </p>
              <Link
                to={homepage.hero_banners[0].cta_link}
                className="inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-10 py-5 rounded-none hover:bg-[#B76E79] hover:text-white transition-all duration-500 group"
                data-testid="hero-cta-button"
              >
                <span className="uppercase tracking-widest text-sm font-medium">
                  {homepage.hero_banners[0].cta_text}
                </span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {banners.length > 0 && (
        <section className="py-12 bg-black" data-testid="banners-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden group cursor-pointer"
                  data-testid={`banner-${banner.id}`}
                >
                  <div className="relative h-96">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-normal mb-2" style={{ color: '#D4AF37' }}>{banner.title}</h3>
                    {banner.subtitle && <p className="text-sm mb-4 text-white/80">{banner.subtitle}</p>}
                    {banner.cta_text && banner.cta_link && (
                      <Link
                        to={banner.cta_link}
                        className="inline-flex items-center gap-2 text-white border border-white px-6 py-2 hover:bg-white hover:text-black transition-all"
                      >
                        <span className="text-sm uppercase tracking-wider">{banner.cta_text}</span>
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 md:py-32 bg-white" data-testid="categories-section">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-widest text-[#B76E79] mb-4">Explore Our Collections</p>
            <h2 className="text-3xl md:text-5xl">Shop by Category</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                data-testid={`category-${category.slug}`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#F5F2EB] mb-4">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-center text-lg font-normal group-hover:text-[#B76E79] transition-colors">
                    {category.name}
                  </h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-24 md:py-32 bg-[#F5F2EB]" data-testid="featured-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs uppercase tracking-widest text-[#B76E79] mb-4">Curated for You</p>
              <h2 className="text-3xl md:text-5xl mb-4">Featured Collection</h2>
              <p className="text-[#585858] max-w-2xl mx-auto">Discover our handpicked selection of exquisite fragrances</p>
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

      {bestSelling.length > 0 && (
        <section className="py-24 md:py-32" data-testid="bestsellers-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs uppercase tracking-widest text-[#B76E79] mb-4">Customer Favorites</p>
              <h2 className="text-3xl md:text-5xl">Best Selling Fragrances</h2>
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
        <section className="py-24 md:py-32 bg-[#F5F2EB]" data-testid="new-arrivals-section">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-xs uppercase tracking-widest text-[#B76E79] mb-4">Just Arrived</p>
              <h2 className="text-3xl md:text-5xl">New Arrivals</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

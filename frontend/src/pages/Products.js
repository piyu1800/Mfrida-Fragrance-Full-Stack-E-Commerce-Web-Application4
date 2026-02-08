import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category') || '',
    min_price: '',
    max_price: '',
    search: searchParams.get('search') || '',
    sort_by: 'created_at',
    sort_order: -1
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, searchParams]);

  const handleAddToCart = (e, product) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?is_active=true`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      const categorySlug = searchParams.get('category');
      if (categorySlug) {
        const category = categories.find(c => c.slug === categorySlug);
        if (category) params.append('category_id', category.id);
      }
      
      if (searchParams.get('new') === 'true') params.append('is_new_arrival', 'true');
      if (searchParams.get('featured') === 'true') params.append('is_featured', 'true');
      if (searchParams.get('bestselling') === 'true') params.append('is_best_selling', 'true');
      
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.search) params.append('search', filters.search);
      
      params.append('sort_by', filters.sort_by);
      params.append('sort_order', filters.sort_order);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
   }
}, [filters, searchParams, categories]);

  const handleSortChange = (e) => {
    const value = e.target.value;
    let sortBy = 'created_at';
    let sortOrder = -1;

    switch (value) {
      case 'price-asc':
        sortBy = 'final_price';
        sortOrder = 1;
        break;
      case 'price-desc':
        sortBy = 'final_price';
        sortOrder = -1;
        break;
      case 'name-asc':
        sortBy = 'name';
        sortOrder = 1;
        break;
      case 'name-desc':
        sortBy = 'name';
        sortOrder = -1;
        break;
      case 'rating':
        sortBy = 'average_rating';
        sortOrder = -1;
        break;
      default:
        sortBy = 'created_at';
        sortOrder = -1;
    }

    setFilters({ ...filters, sort_by: sortBy, sort_order: sortOrder });
  };

  return ( 
    <div className="py-24" data-testid="products-page">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl mb-4">All Products</h1>
          <p className="text-[#585858]">Discover our complete collection of luxury fragrances</p>
        </div>

        <div className="flex gap-8">
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 space-y-8`}>
            <div>
              <h3 className="text-lg font-medium mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSearchParams({});
                    setFilters({ ...filters, category_id: '' });
                  }}
                  className={`block w-full text-left py-2 px-4 rounded-none transition-colors ${
                    !searchParams.get('category') ? 'bg-[#F5F2EB]' : 'hover:bg-[#F5F2EB]/50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSearchParams({ category: category.slug })}
                    className={`block w-full text-left py-2 px-4 rounded-none transition-colors ${
                      searchParams.get('category') === category.slug ? 'bg-[#F5F2EB]' : 'hover:bg-[#F5F2EB]/50'
                    }`}
                    data-testid={`filter-category-${category.slug}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Price Range</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.min_price}
                  onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                  className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-2"
                  data-testid="min-price-input"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                  className="w-full bg-transparent border-b border-[#1A1A1A]/30 focus:border-[#1A1A1A] outline-none px-0 py-2"
                  data-testid="max-price-input"
                />
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[#585858]">{products.length} products</p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 text-sm"
                  data-testid="toggle-filters-button"
                >
                  <SlidersHorizontal size={18} />
                  Filters
                </button>
                
                <select
                  onChange={handleSortChange}
                  className="bg-transparent border border-[#1A1A1A]/20 px-4 py-2 text-sm"
                  data-testid="sort-select"
                >
                  <option value="created_at">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-[#585858]">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {products.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group"
                          data-testid={`product-${product.slug}`}
                        >
                          <Link to={`/product/${product.slug}`}>
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
                          </Link>
                          
                          <div className="space-y-3">
                            <Link to={`/product/${product.slug}`}>
                              <p className="text-xs uppercase tracking-widest text-[#585858]">{product.brand}</p>
                              <h3 className="text-lg font-normal hover:text-[#B76E79] transition-colors">{product.name}</h3>
                            </Link>
                            
                            {/* Rating Display */}
                            {product.total_reviews > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={14}
                                      className={i < Math.floor(product.average_rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-[#585858]">
                                  {product.average_rating} ({product.total_reviews})
                                </span>
                              </div>
                            )}
                            
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
                            
                            {/* Add to Cart Button */}
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={product.stock === 0}
                              className="w-full bg-[#1A1A1A] text-[#FDFBF7] py-3 px-4 hover:bg-[#B76E79] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              data-testid={`add-to-cart-${product.slug}`}
                            >
                              <ShoppingCart size={16} />
                              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                          </div>
                        </motion.div>
                      ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;

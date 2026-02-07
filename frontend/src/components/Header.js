import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchNavItems();
  }, []);


  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    if (query.trim().length < 2) {
      return; // Wait for at least 2 characters
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API}/products?search=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const fetchNavItems = async () => {
    try {
      const response = await axios.get(`${API}/admin/navigation`);
      setNavItems(response.data.filter(item => item.is_active));
    } catch (error) {
      console.error('Error fetching navigation:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-[#1A1A1A]/10">
      {/* Top Bar: Banner/Announcement */}
      <div className="bg-[#1A1A1A] text-white text-center py-2">
        <p className="text-xs uppercase tracking-widest">SALE is Live!</p>
      </div>

      {/* Main Header: Logo + Search Bar + Icons */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0" data-testid="logo-link">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Mfrida</h1>
            </Link>

            {/* Large Search Bar (Desktop Only) */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#585858]" />
                <input
                  type="text"
                  placeholder="Search for fragrances..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full pl-12 pr-4 py-3 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#B76E79] text-sm"
                  data-testid="desktop-search-input"
                />
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-5">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="lg:hidden hover:text-[#B76E79] transition-colors"
                data-testid="search-button"
              >
                <Search size={20} />
              </button>

              {/* Account */}
              {user ? (
                <div className="relative group">
                  <button
                    className="flex flex-col items-center hover:text-[#B76E79] transition-colors"
                    data-testid="user-menu-button"
                  >
                    <User size={22} />
                    <span className="hidden md:block text-xs mt-1">Account</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#1A1A1A]/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-4 border-b border-[#1A1A1A]/10">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-[#585858]">{user.email}</p>
                    </div>
                    <Link
                      to={user.role === 'admin' ? '/admin' : '/profile'}
                      className="block px-4 py-2 text-sm hover:bg-[#F5F2EB] transition-colors"
                      data-testid="profile-link"
                    >
                      {user.role === 'admin' ? 'Admin Dashboard' : 'My Profile'}
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm hover:bg-[#F5F2EB] transition-colors"
                      data-testid="orders-link"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-[#F5F2EB] transition-colors"
                      data-testid="logout-button"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="flex flex-col items-center hover:text-[#B76E79] transition-colors"
                  data-testid="login-link"
                >
                  <User size={22} />
                  <span className="hidden md:block text-xs mt-1">Account</span>
                </Link>
              )}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative flex flex-col items-center hover:text-[#B76E79] transition-colors"
                data-testid="wishlist-link"
              >
                <Heart size={22} />
                <span className="hidden md:block text-xs mt-1">Wishlist</span>
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B76E79] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="wishlist-count">
                    {getWishlistCount()}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex flex-col items-center hover:text-[#B76E79] transition-colors"
                data-testid="cart-link"
              >
                <ShoppingCart size={22} />
                <span className="hidden md:block text-xs mt-1">Cart</span>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B76E79] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden hover:text-[#B76E79] transition-colors"
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar Below Search (Titan Style) */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <nav className="hidden lg:flex items-center justify-center gap-10 h-12">
            {navItems.slice(0, 8).map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="text-sm uppercase tracking-wider hover:text-[#B76E79] transition-colors font-medium"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E5E5E5]">
          <nav className="py-4 px-6" data-testid="mobile-menu">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="block py-3 text-sm uppercase tracking-widest hover:text-[#B76E79] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
           {/* Mobile Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] lg:hidden" onClick={closeSearch}>
          <div 
            className="bg-white w-full max-w-3xl mx-auto mt-20 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-6 border-b border-[#1A1A1A]/10">
              <div className="flex items-center gap-4">
                <Search size={24} className="text-[#585858]" />
                <input
                  type="text"
                  placeholder="Search for fragrances..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 text-lg outline-none"
                  autoFocus
                  data-testid="search-input"
                />
                <button 
                  onClick={closeSearch}
                  className="text-[#585858] hover:text-[#B76E79]"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {isSearching && (
                <p className="text-center text-[#585858]">Searching...</p>
              )}
              
              {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                <p className="text-center text-[#585858]">No products found for "{searchQuery}"</p>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug}`}
                      onClick={closeSearch}
                      className="flex items-center gap-4 p-3 hover:bg-[#F5F2EB] transition-colors rounded"
                      data-testid={`search-result-${product.id}`}
                    >
                      <div className="w-16 h-16 bg-[#F5F2EB] flex-shrink-0 overflow-hidden rounded">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-[#585858]">{product.brand}</p>
                        <p className="text-sm font-medium mt-1">₹{product.final_price.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {!isSearching && searchQuery.trim().length === 0 && (
                <p className="text-center text-[#585858]">Start typing to search fragrances...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Search Results Dropdown */}
      {searchOpen && searchQuery.trim().length > 0 && (
        <div className="hidden lg:block absolute top-full left-0 right-0 bg-white border-b border-[#E5E5E5] shadow-lg z-50">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-6">
            {isSearching && (
              <p className="text-center text-[#585858]">Searching...</p>
            )}
            
            {!isSearching && searchResults.length === 0 && (
              <p className="text-center text-[#585858]">No products found for "{searchQuery}"</p>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-4 p-3 hover:bg-[#F5F2EB] transition-colors rounded"
                    data-testid={`search-result-${product.id}`}
                  >
                    <div className="w-16 h-16 bg-[#F5F2EB] flex-shrink-0 overflow-hidden rounded">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-[#585858]">{product.brand}</p>
                      <p className="text-sm font-medium mt-1">₹{product.final_price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      
    </header>
  );
};

export default Header;

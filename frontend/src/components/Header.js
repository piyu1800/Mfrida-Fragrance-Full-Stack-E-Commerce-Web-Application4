import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    fetchNavItems();
  }, []);

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
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h1 className="text-2xl md:text-3xl font-normal tracking-tight">Mfrida</h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="text-sm uppercase tracking-widest hover:text-[#B76E79] transition-colors"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              className="hover:text-[#B76E79] transition-colors"
              data-testid="search-button"
            >
              <Search size={20} />
            </button>

            {user ? (
              <div className="relative group">
                <button
                  className="hover:text-[#B76E79] transition-colors"
                  data-testid="user-menu-button"
                >
                  <User size={20} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#1A1A1A]/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
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
                className="hover:text-[#B76E79] transition-colors"
                data-testid="login-link"
              >
                <User size={20} />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative hover:text-[#B76E79] transition-colors"
              data-testid="cart-link"
            >
              <ShoppingCart size={20} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#B76E79] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                  {getCartCount()}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden hover:text-[#B76E79] transition-colors"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-[#1A1A1A]/10" data-testid="mobile-menu">
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
        )}
      </div>
    </header>
  );
};

export default Header;

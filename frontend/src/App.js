import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import Orders from './pages/Orders';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import UsersManagement from './pages/admin/UsersManagement';
import BannersManagement from './pages/admin/BannersManagement';
import NavigationManagement from './pages/admin/NavigationManagement';
import './App.css';

// Protected Route Component for Admin
const AdminProtectedRoute = ({ children }) => {
  const { adminData, loading } = useAdmin();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B76E79]"></div>
    </div>;
  }
  
  return adminData ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdminProvider>
          <BrowserRouter>
            <div className="App">
              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/*"
                  element={
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<ProductsManagement />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="banners" element={<BannersManagement />} />
                  <Route path="navigation" element={<NavigationManagement />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="users" element={<UsersManagement />} />
                </Route>

                {/* Customer Routes */}
                <Route path="/*" element={
                  <>
                    <Header />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:slug" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/orders" element={<Orders />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>
              <Toaster position="top-right" richColors />
            </div>
          </BrowserRouter>
        </AdminProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
